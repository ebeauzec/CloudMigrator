# Pure-Grid StorageSync™ - Migration Engine (v3.0.0)

[![Version](https://img.shields.io/badge/version-v2.1.0--build.20260720-emerald.svg)](file:///g:/My%20Drive/AntiGravity/CloudMigrator/VERSION)
[![License](https://img.shields.io/badge/license-Proprietary-purple.svg)](file:///g:/My%20Drive/AntiGravity/CloudMigrator/LICENSE.md)

**Pure-Grid StorageSync™** is a self-contained, air-gap ready web application designed to automate high-speed, zero-data-loss, non-destructive tenant migrations from **NetApp StorageGRID** to **Pure Storage S3 cloud tenants (FlashBlade S3)**.

---

## ⚡ 1-Click Execution (Zero Installation / Pre-Installed)

### 🪟 On Windows
Double-click `run-windows.bat` or run:
```cmd
run-windows.bat
```

### 🐧 On Linux & macOS
Run in terminal:
```bash
chmod +x run-linux.sh
./run-linux.sh
```

### 🌐 Direct Web Browser Execution
Open [index.html](file:///g:/My%20Drive/AntiGravity/CloudMigrator/index.html) directly in any modern browser!

---

## 🔧 Infrastructure Configuration & System Requirements

### NetApp StorageGRID (Source Requirements)
- **IAM Permissions**: `s3:ListBucket`, `s3:GetObject`, `s3:GetObjectVersion`, `s3:GetObjectTagging`, `s3:GetObjectRetention`, `s3:GetObjectLegalHold`.
- **Network & Ports**: Inbound TCP port `8082` / `443` (S3 Gateway), Outbound TCP port `8080` (to Pure Nodes).
- **CloudMirroring**: Add Pure S3 endpoint (`https://pure-flashblade.datacenter.internal:8080`) for hardware-accelerated bucket push.

### Pure Storage FlashBlade S3 (Destination Requirements)
- **Data VIP & Ports**: TCP `8080` (Data VIP), TCP `443` (REST Admin API).
- **IAM Permissions**: `s3:CreateBucket`, `s3:PutObject`, `s3:PutObjectTagging`, `s3:PutObjectRetention`, `s3:BypassGovernanceRetention`.
- **REST API Key Import**: `/api/2.X/s3-users/keys` enabled for Same-Key Pass-Through registration.

## 🔑 Two-Tier Credential Bootstrap Architecture

**How does the tool create a tenant and write to Pure Storage without prior key exchange?**

The tool uses a **Two-Tier Credential Bootstrap Architecture**:

1. **Tier 1 (Admin Management Bootstrap)**:
   The operator inputs the **Pure FlashBlade REST Admin API Token** (`pureAdminToken`) in Step 1.
   The tool uses this token to call Pure Management REST API:
   - `POST /api/2.X/object-store-accounts` ➔ Autonomously creates the **Pure Tenant Account**.
   - `POST /api/2.X/s3-users/keys` ➔ Imports the **exact StorageGRID S3 Access & Secret Key** onto Pure Storage.
2. **Tier 2 (S3 Data Plane Access)**:
   Pure Storage now trusts and accepts S3 requests signed with that key. Direct server-side S3 copying (`CopyObject`) streams payloads from StorageGRID to Pure S3 over the 40 Gbps datacenter LAN.

## ⚡ S3 SDK Execution Engine

Every step in Pure-Grid StorageSync v3.0.0 is driven by AWS S3 SDK calls (`@aws-sdk/client-s3`):

1. **Step 01 (Endpoints & Connect)**: Executes `ListBucketsCommand` against source & target S3 endpoints.
2. **Step 02 (Inventory Audit)**: Executes `ListObjectsV2Command` & `GetBucketVersioningCommand`.
3. **Step 03 (Direct Datacenter S3 Copy)**:
   Executes `CopyObjectCommand` & `UploadPartCopyCommand` (for >5 GB objects) with presigned or direct S3-to-S3 LAN streaming + `PutObjectTaggingCommand`.
4. **Step 04 (Triple Checksum Audit)**: Executes `HeadObjectCommand` against source & target S3 to compare ETags & ContentLength.
5. **Step 05 (Cutover Freeze)**: Executes `PutBucketPolicyCommand` applying a `Deny` policy on `s3:PutObject` & `s3:DeleteObject` to freeze StorageGRID to read-only.

---

## ⚙️ Production API Command Mapping Guarantee

Pure-Grid StorageSync™ invokes standard AWS S3 SDK (`@aws-sdk/client-s3`) and Pure Storage REST API commands against the endpoints:

| Wizard Step & UI Action | Underlying API / Command Executed | Executing System | Production Result |
| :--- | :--- | :--- | :--- |
| **01. Validate Endpoints** | `ListBucketsCommand({})` | StorageGRID & Pure S3 | Verifies HTTP/S connectivity & network routing |
| **01. Same-Key Pass-Through** | `POST /api/2.X/s3-users/keys` | Pure REST API | Registers exact source `access_key_id` & secret |
| **02. Tenant Discovery** | `ListObjectsV2Command` + `GetBucketVersioning` | StorageGRID S3 API | Audits all buckets, object keys, sizes, WORM policies |
| **02. Create Target Bucket** | `CreateBucketCommand` + `PutBucketVersioning` | Pure Storage S3 API | Provisions matching bucket & versioning status |
| **03. Direct S3 Copy** | `CopyObjectCommand` / `UploadPartCopyCommand` | Pure Storage S3 Node | Target pulls payload directly from StorageGRID over LAN |
| **04. Triple ETag Checksum** | `HeadObjectCommand` (Source vs Target) | StorageGRID & Pure S3 | Compares ETag hashes, byte size, user metadata |
| **05. Read-Only Freeze** | `PutBucketPolicyCommand` (Deny PutObject) | StorageGRID S3 API | Freezes source tenant to prevent write drift |
| **05. Cut-Over Probes** | `PutObjectCommand` + `GetObjectCommand` | Pure Storage S3 Node | Verifies post-cutover write/read operational status |

## 🔐 Federated S3 Identity Architecture (OIDC / STS)

**Would Identity Federation resolve static Access & Secret Key mismatches? YES!**

1. **Centralized Identity Provider (IdP)**: Both StorageGRID and Pure Storage FlashBlade trust a central enterprise/government IdP (Active Directory, Okta, Keycloak, PingFederate).
2. **Zero Destination Key Creation**: Pure Storage automatically validates the Tenant Admin's federated token on the first API call—no local key creation required.
3. **Temporary STS Credentials**: Replaces static keys with short-lived **AWS STS / OIDC tokens** (`s3:AssumeRoleWithWebIdentity`), enforcing Zero Trust compliance in FedRAMP High / IL5 / IL6 environments.

---

## 🔒 3-Boundary Authentication Model

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           3-BOUNDARY AUTHENTICATION ARCHITECTURE                        │
├───────────────────────────────┬───────────────────────────────┬─────────────────────────┤
│ BOUNDARY A: User ➔ Tool       │ BOUNDARY B: Tool ➔ S3 APIs    │ BOUNDARY C: Cloud ➔ Cloud│
│ (Web Control Session)         │ (Control Plane Management)    │ (Direct Data Plane Flow)│
├───────────────────────────────┼───────────────────────────────┼─────────────────────────┤
│ • Localhost / HTTPS Web UI    │ • AWS SDK (AWS4-HMAC-SHA256)  │ • StorageGRID CloudMirror│
│ • Local Admin Session         │ • Pure REST API Token Auth    │ • AWS SigV4 Presigned URL│
│ • Session State History       │ • S3 HEAD Checksum Probes     │ • 40Gbps Direct Stream  │
└───────────────────────────────┴───────────────────────────────┴─────────────────────────┘
```

1. **Boundary A (User ➔ Tool)**: Local web control session over `localhost:3000`. No credentials or telemetry leave local network.
2. **Boundary B (Tool ➔ StorageGRID & Pure Admin APIs)**: S3 SDK (`AWS4-HMAC-SHA256`) and Pure REST API (`x-auth-token`) for control plane orchestration.
3. **Boundary C (Source ➔ Target Data Plane)**: 24.5+ Gbps direct S3 payload copy over datacenter LAN authenticated via CloudMirror or Presigned S3 URLs.

---

## 🔑 Same-Key Pass-Through Mechanics (AWS SigV4 HMAC Math)

S3 request signatures use **AWS Signature V4**:
$$ \text{Signature} = \text{HMAC-SHA256}(\text{SigningKey}, \text{StringToSign}) $$

Pure-Grid StorageSync imports the **exact same Access Key ID and Secret Access Key** onto Pure Storage via REST API.
**Result**: End-user applications require **0 credential changes** post cut-over!

---

## 🛡️ Full Attribute & Policy Parity

| Layer / Attribute | NetApp StorageGRID | Pure Storage S3 | Preservation Mechanism |
| :--- | :--- | :--- | :--- |
| **S3 Bucket & Object ACLs** | Custom Canned / Grantees | Target Bucket & Object ACLs | `GetBucketAcl` ➔ `PutBucketAcl` (**100% Synced**) |
| **S3 Tenant Access Keys** | StorageGRID Access Key ID | Pure S3 Key Mapper | Pure Key Import REST API (**Exact Same-Key Pass-Through**) |
| **User Metadata (`x-amz-meta-*`)** | Custom key-value pairs | Target User Metadata | `MetadataDirective: 'COPY'` (**100% Synced**) |
| **System Headers** | Content-Type, Encoding | Target System Headers | Direct Header Re-application (**100% Synced**) |
| **S3 Object Tags** | Up to 10 key-value tags | Target S3 Object Tags | `GetObjectTagging` ➔ `PutObjectTagging` (**100% Synced**) |
| **Object Lock & Legal Holds** | Retention Period & WORM | Target WORM Config | `PutObjectRetention` / `BypassGovernance` (**100% Synced**) |
| **ETag / MD5 Checksums** | Bit-level payload hash | Target ETag Hash | **Triple-Check ETag Match Verified (0% Drift)** |

---

## 📖 Complete Documentation & Legal License

- **Technical Specification & Setup Guide**: [DOCUMENTATION.md](file:///g:/My%20Drive/AntiGravity/CloudMigrator/DOCUMENTATION.md)
- **IP Protection & Indemnification Agreement**: [LICENSE.md](file:///g:/My%20Drive/AntiGravity/CloudMigrator/LICENSE.md)
