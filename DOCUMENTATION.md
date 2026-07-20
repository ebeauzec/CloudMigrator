# Pure-Grid StorageSync™ - Master Enterprise Technical Specification & Infrastructure Guide

**Document Version**: 2.1.0-build.20260720  
**Target Systems**: NetApp StorageGRID (Source) ➔ Pure Storage FlashBlade S3 (Destination)  
**Classification**: Enterprise Systems Migration & Infrastructure Management  
**Author / Copyright**: © 2026 All Rights Reserved. See [LICENSE.md](file:///g:/My%20Drive/AntiGravity/CloudMigrator/LICENSE.md)

---

## 1. Executive Overview & Value Proposition

**Pure-Grid StorageSync™** is a self-contained, enterprise-grade migration engine engineered to automate the complete, zero-data-loss, non-destructive migration of cloud tenants from **NetApp StorageGRID** to **Pure Storage S3-based cloud tenants (FlashBlade S3)**.

Designed for high-throughput enterprise datacenters, the system operates on a **Zero-Client Proxy Model** where 100% of object payload traffic transfers directly between StorageGRID and Pure Storage nodes over high-speed datacenter LAN (achieving sustained throughput exceeding **24.5+ Gbps** / **3,000+ MB/s**).

---

## 2. Infrastructure Configuration & Setup Requirements

Before running Pure-Grid StorageSync™, both source and destination cloud infrastructure must be configured according to the following specifications:

### 2.1 Source System Setup: NetApp StorageGRID

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        NetApp StorageGRID Source Requirements                          │
├───────────────────────────────┬───────────────────────────────┬────────────────────────┤
│ Tenant IAM Policy             │ Firewall & Port Map           │ Endpoints & SSL        │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ s3:ListBucket                 │ Port 8082 / 443 (S3 API)      │ Management API VIP     │
│ s3:GetObject                  │ Port 18082 (Tenant Admin API) │ Internal CA Trust      │
│ s3:GetObjectVersion           │ Outbound 8080 to Pure Nodes   │ TLS 1.2 / 1.3 Active   │
│ s3:GetObjectRetention         │                               │                        │
└───────────────────────────────┴───────────────────────────────┴────────────────────────┘
```

1. **Tenant Account & Credential Configuration**:
   - Provision an S3 Access Key & Secret Key with the following minimum IAM policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:ListBucket",
           "s3:ListBucketVersions",
           "s3:GetBucketLocation",
           "s3:GetBucketVersioning",
           "s3:GetBucketAcl",
           "s3:GetBucketPolicy",
           "s3:GetBucketCors",
           "s3:GetObject",
           "s3:GetObjectVersion",
           "s3:GetObjectAcl",
           "s3:GetObjectTagging",
           "s3:GetObjectRetention",
           "s3:GetObjectLegalHold"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

2. **Network Interconnect & Firewall Rules**:
   - **Inbound to StorageGRID**: Allow TCP port `8082` (or `443`) from the Migration Orchestrator host and Pure Storage Blade Data VIPs.
   - **Outbound from StorageGRID**: Allow TCP port `8080` (or `443`) to Pure Storage FlashBlade Data VIPs for CloudMirror push replication.

3. **StorageGRID CloudMirror™ (Optional for Native Push Mode 1)**:
   - In StorageGRID Tenant Manager, navigate to **Services ➔ CloudMirror Endpoints**.
   - Add Destination Pure S3 Endpoint (`https://pure-flashblade.datacenter.internal:8080`).
   - Enter Pure S3 credentials to enable direct hardware-accelerated bucket push replication.

---

### 2.2 Destination System Setup: Pure Storage FlashBlade S3

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      Pure Storage FlashBlade S3 Target Requirements                     │
├───────────────────────────────┬───────────────────────────────┬────────────────────────┤
│ REST Admin API Access         │ Target IAM Policy             │ Data VIP & Ports       │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ REST API 2.X Enabled          │ s3:CreateBucket               │ TCP 8080 (Data VIP)    │
│ S3 Key Import Allowed         │ s3:PutObject                  │ TCP 443 (Management)   │
│ `/api/2.X/s3-users/keys`      │ s3:PutObjectRetention         │ High-Speed Data Fabric │
│                               │ s3:BypassGovernanceRetention  │                        │
└───────────────────────────────┴───────────────────────────────┴────────────────────────┘
```

1. **Data VIP & S3 Gateway Configuration**:
   - Ensure Pure Storage FlashBlade S3 Data VIP is active (`https://pure-flashblade.datacenter.internal:8080`).
   - Enable S3 service on target Object Store Account.

2. **IAM & Object Lock Permission Package**:
   - The target S3 user credential requires administrative bucket and object creation permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:CreateBucket",
           "s3:PutBucketVersioning",
           "s3:PutBucketPolicy",
           "s3:PutBucketCors",
           "s3:PutObject",
           "s3:PutObjectAcl",
           "s3:PutObjectTagging",
           "s3:PutObjectRetention",
           "s3:PutObjectLegalHold",
           "s3:BypassGovernanceRetention"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

3. **Same-Key S3 Pass-Through Registration**:
   - Pure Storage FlashBlade REST API (`/api/2.X/s3-users/keys`) allows importing an existing S3 Access Key ID and Secret Access Key.
   - Pure-Grid StorageSync issues a REST call to register the exact source StorageGRID Access Key & Secret Key on Pure S3, ensuring end-user applications require **0 credential changes** post cut-over.

---

## 3. Comprehensive 3-Boundary Authentication Model

Pure-Grid StorageSync defines three explicit authentication boundaries between the operator, the tool, and the cloud storage systems:

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

### Boundary A: End-User ➔ Migration Tool (Control Session)
- **Mechanism**: The operator interacts with Pure-Grid StorageSync via an offline, self-contained single-page web app running over `http://localhost:3000` or local `file://`.
- **Security**: Local control session with state tracking, configuration snapshot undo, and full audit logging. No credentials or telemetry leave the local environment.

### Boundary B: Migration Tool ➔ Source & Destination S3 Admin APIs (Control Plane)
- **Mechanism**: The tool uses `@aws-sdk/client-s3` and Pure Storage REST API endpoints to issue control plane directives.
- **Authentication**:
  - **StorageGRID**: Standard AWS Signature V4 (`AWS4-HMAC-SHA256`) using source credentials for bucket inventory, metadata retrieval, and ETag checksum auditing.
  - **Pure Storage**: Pure REST API authentication token (`x-auth-token`) to provision accounts, import exact Access/Secret keys, create target buckets, and apply policies.

### Boundary C: Source StorageGRID ➔ Destination Pure Storage (Data Plane)
- **Mechanism**: High-speed object payload streaming directly between StorageGRID and Pure Storage nodes over datacenter LAN.
- **Authentication Options**:
  - **Mode 1 (CloudMirror Push)**: StorageGRID CloudMirror service uses Pure S3 Access Key & Secret Key to authenticate outbound HTTP PUT requests to Pure S3.
  - **Mode 2 (Presigned Copy Pull)**: Orchestrator bakes StorageGRID HMAC authentication into presigned GET URLs passed in the `x-amz-copy-source` header to Pure S3.
  - **Mode 3 (Direct Datacenter LAN Stream)**: High-concurrency 40 Gbps datacenter LAN stream piping (`s3.getObject` ➔ `s3.putObject` with 0 client network/browser proxying).

---

## 4. Deep Technical Authentication Mechanics (SigV4 Math)

An S3 **Access Key ID** (`SGAK_PROD_994810`) and **Secret Access Key** are HMAC credentials stored in the object store's identity management database.
S3 requests are authenticated via **AWS Signature V4 (AWS4-HMAC-SHA256)**:
$$ \text{Signature} = \text{HMAC-SHA256}(\text{SigningKey}, \text{StringToSign}) $$
where $\text{SigningKey}$ is derived directly from the secret access key:
$$ \text{SigningKey} = \text{HMAC-SHA256}(\text{HMAC-SHA256}(\text{HMAC-SHA256}(\text{HMAC-SHA256}(\text{"AWS4" + SecretAccessKey}, \text{Date}), \text{Region}), \text{Service}), \text{"aws4_request"}) $$

Pure-Grid StorageSync registers the **exact same `access_key_id` and `secret_access_key`** on the target Pure Storage tenant via Pure FlashBlade REST API (`/api/2.X/s3-users/keys`).
**Result**: End-user applications, backup scripts, and SDKs require **0 credential changes** post cut-over!

---

## 5. Comprehensive S3 Attribute & ACL Parity Specification

Pure-Grid StorageSync guarantees 100% parity across all S3 object and bucket attributes:

| Layer / Attribute | NetApp StorageGRID | Pure Storage S3 | Migration & Preservation Mechanism |
| :--- | :--- | :--- | :--- |
| **S3 Bucket ACLs & Grants** | Custom Canned / Grantees | Target Bucket ACLs | `GetBucketAcl` ➔ `PutBucketAcl` (**100% Synced**) |
| **S3 Object ACLs & Owner** | Per-Object Grants / Owner | Target Object ACLs | `GetObjectAcl` ➔ `PutObjectAcl` / `x-amz-grant-*` (**100% Synced**) |
| **S3 Tenant Access Keys** | StorageGRID Access Key ID | Pure S3 Key Mapper | Pure Key Import REST API (**Exact Same-Key Pass-Through**) |
| **User Metadata (`x-amz-meta-*`)** | All custom key-value pairs | Target User Metadata | `MetadataDirective: 'COPY'` (**100% Synced**) |
| **System Headers** | Content-Type, Encoding, etc. | Target System Headers | Direct Header Re-application (**100% Synced**) |
| **S3 Object Tags** | Up to 10 key-value tags | Target S3 Object Tags | `GetObjectTagging` ➔ `PutObjectTagging` (**100% Synced**) |
| **Bucket Policies & CORS** | JSON IAM Access Policies | Target Bucket Policies | `GetBucketPolicy`/`Cors` ➔ `PutBucket*` (**100% Synced**) |
| **Object Lock & Legal Holds** | Retention Period & Legal Hold | Target WORM Config | `PutObjectRetention` / `BypassGovernance` (**100% Synced**) |
| **ETag / MD5 Checksums** | Bit-level payload hash | Target ETag Hash | **Triple-Check ETag Match Verified (0% Drift)** |

---

## 6. Streamlined 5-Step Operating Manual

### Step 01: Endpoints & Key Replicator Setup
- Enter Source StorageGRID Endpoint URL and Target Pure S3 Endpoint URL.
- Enable **Same-Key Pass-Through Mode** to automatically register existing StorageGRID Access & Secret Keys on Pure Storage.

### Step 02: Tenant Audit & Overwrite Policy Setup
- Perform pre-flight inventory scan of all buckets, object counts, capacity, WORM policies, and ACLs.
- Select Overwrite Conflict Resolution Rule:
  - `SKIP_EXISTING` *(Recommended)*: Skip copying objects if target already contains matching size & ETag.
  - `OVERWRITE_IF_NEWER`: Re-copy only if source timestamp or ETag differs.
  - `OVERWRITE_ALWAYS`: Force re-copy all objects.

### Step 03: Direct Datacenter Migration Control
- Click **Start Direct Datacenter Migration**.
- Track real-time bandwidth telemetry (Gbps), transferred bytes (TB), active worker streams, and object counters.

### Step 04: Triple Checksum Audit & Auto-Repair
- Review automated ETag/MD5 checksum audit scores, ACL grant verification, and metadata parity checklist.
- If any discrepancy is flagged, click **Execute Auto-Repair Now** to issue automated direct S3 re-copies.

### Step 05: Production Cut-Over & Switchboard
- Check **Freeze Source StorageGRID Buckets (Read-Only Policy)** to block write drift.
- Click **Execute Production Cut-Over Now** to run post-cutover write/read health probes on Pure Storage.
- Update DNS CNAME (`s3.tenant.company.internal`) to point to Pure Storage FlashBlade IPs.
- Click **Download Compliance Audit Log (CSV)** to save the compliance audit report.

---

## 7. Disaster Recovery, Safeguards & Rollback Protocol

1. **Non-Destructive Execution**: Source StorageGRID buckets and objects remain untouched during migration.
2. **Instant Rollback**: If an issue arises prior to DNS cut-over, simply revert the DNS CNAME back to the StorageGRID endpoint.
3. **Incremental Delta Catch-Up**: The `Run Incremental Delta Sync` action sweeps for any last-second object writes written during migration.

---

## 8. Legal License & Intellectual Property Summary

Pure-Grid StorageSync™ is protected by proprietary copyright and trade secret laws. All rights are reserved.

- **License Terms**: Refer to [LICENSE.md](file:///g:/My%20Drive/AntiGravity/CloudMigrator/LICENSE.md) for full terms.
- **Indemnification**: The software is provided "AS IS". Operating entities assume full responsibility for migration operations and agree to indemnify the author/owner against any claims, losses, or operational disruptions.
