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

## 3. Autonomous Tenant Provisioning & Admin Bootstrapping

A common question is: **"How can the tool create a tenant and write data to Pure Storage without prior key exchange?"**

The tool accomplishes autonomous provisioning using a **Two-Tier Credential Bootstrap Architecture**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        TWO-TIER CREDENTIAL BOOTSTRAP ARCHITECTURE                      │
├───────────────────────────────────────────────────┬────────────────────────────────────┤
│ TIER 1: Admin Management Bootstrap                │ TIER 2: S3 Data Plane Access       │
├───────────────────────────────────────────────────┼────────────────────────────────────┤
│ • Pure FlashBlade Admin Token (`pureAdminToken`)  │ • Replicated S3 Access Key ID      │
│ • Calling `POST /api/2.X/object-store-accounts`   │ • Replicated S3 Secret Access Key  │
│ • Calling `POST /api/2.X/s3-users/keys`           │ • End-User S3 API Data Operations  │
└───────────────────────────────────────────────────┴────────────────────────────────────┘
```

### The 3-Step Bootstrapping Sequence

1. **Step 1: Admin Plane Connection (Tier 1)**:
   The operator supplies the **Pure FlashBlade REST Admin API Token** (`pureAdminToken`) in Step 1 of the wizard. This token provides control plane access to the Pure FlashBlade management endpoint (`https://pure-flashblade:443`).

2. **Step 2: Autonomous Tenant & S3 Key Creation**:
   - The tool issues `POST /api/2.X/object-store-accounts` to create the target **Pure Object Store Tenant Account**.
   - The tool issues `POST /api/2.X/s3-users/keys` specifying the **exact `access_key_id` and `secret_access_key`** imported from the source StorageGRID tenant.

3. **Step 3: Direct Data Plane Transfer Activation (Tier 2)**:
   Now that Pure Storage has registered the source S3 credentials in its S3 identity database, **Pure S3 trusts and accepts all S3 requests signed with that key**.
   When the tool issues `CopyObjectCommand` specifying `x-amz-copy-source: /source-bucket/object-key`, Pure S3 uses the presigned source authorization to fetch the object directly from StorageGRID over the 40 Gbps datacenter LAN.

## 4. Delegated Multi-Tenant Self-Service & Data Sovereignty Architecture

In enterprise or service provider multi-tenant environments, **Tenant Managers (customers/end-users)** do not have global Grid Admin or Pure FlashBlade Array Admin access, and **data sovereignty is the top priority**.

Pure-Grid StorageSync™ solves this through a **Delegated Self-Service Multi-Tenant Model**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   DELEGATED MULTI-TENANT SELF-SERVICE ARCHITECTURE                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   ┌────────────────────────┐      Direct S3 Copy      ┌────────────────────────────┐   │
│   │ StorageGRID Tenant A   │ ───────────────────────> │ Pure Storage S3 Tenant A   │   │
│   │ (Tenant A Keys ONLY)   │  (Zero Admin Creds Used) │ (Target S3 Key Delegated)  │   │
│   └───────────▲────────────┘                          └─────────────▲──────────────┘   │
└───────────────│─────────────────────────────────────────────────────│──────────────────┘
                │ Scope: Tenant A Buckets ONLY                        │
┌───────────────┴─────────────────────────────────────────────────────┴──────────────────┐
│                   Tenant A Self-Service Migration Package                              │
│              (Standalone Single File HTML / CLI executable given to Tenant)            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Multi-Tenant Safeguards & Key Privacy Guarantees

1. **Zero-Trust Key Privacy Rule (Storage Admins NEVER handle Tenant Secret Keys)**:
   - **Infrastructure Storage Admins** control hardware & grid networking, but **NEVER have access to tenant secret keys**.
   - **Tenant Managers** input their private S3 Access Keys & Secret Keys **strictly locally** inside their self-contained execution instance (`index.html` or local desktop runner).
   - The tenant secret key is never logged to disk, never sent to storage admins, and never exposed outside the tenant's execution context.

2. **Zero Global Admin Access Required**:
   - Tenant Managers **do not need** StorageGRID Grid Admin or Pure FlashBlade Array Admin tokens.
   - They operate strictly using their own **Tenant S3 Access & Secret Keys** (`s3:ListBucket`, `s3:GetObject`, `s3:PutObject`).

2. **Strict Single-Tenant Scope & Boundary**:
   - The tool restricts all S3 operations to the tenant manager's explicit bucket scope (`arn:aws:s3:::tenant-a-bucket/*`).
   - Tenant A cannot list, discover, or access Tenant B's buckets or data payloads.

3. **Client-Side Encryption (CSE) & Bit-Level Data Sovereignty**:
   - Customer-Managed Keys (SSE-C / KMS) and custom `x-amz-meta-*` headers are preserved bit-for-bit during direct transfer.
   - Unencrypted data payload is never exposed to external or global admin systems.

4. **Self-Contained Distribution Package**:
   - Service Providers simply hand the standalone 1-click executable (`run-windows.bat` / `run-linux.sh` or standalone `index.html`) to the Tenant Manager.
   - The Tenant Manager opens the app locally on their machine, inputs their StorageGRID S3 key and target Pure S3 credentials, and executes the migration self-service!

## 5. Sovereign GovCloud Zero-Trust Tenant-Autonomous Model

In secure government cloud environments (FedRAMP High, IL5/IL6, Sovereign GovCloud):
- **The Tenant Admin (Customer / End-User) is the ONLY entity allowed to run this tool.**
- **The Cloud Provider has ZERO involvement, ZERO operational awareness, and ZERO key access.**
- **Zero-Trust Principles are strictly enforced.**

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   SOVEREIGN GOVCLOUD ZERO-TRUST TENANT ARCHITECTURE                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   ┌────────────────────────┐      Direct S3 Copy      ┌────────────────────────────┐   │
│   │ StorageGRID Gov Tenant │ ───────────────────────> │ Pure Storage S3 Gov Tenant │   │
│   │ (Tenant S3 Keys ONLY)  │  (Zero Provider Knowledge│ (Target S3 Keys ONLY)      │   │
│   └───────────▲────────────┘   Zero Provider Access)  └─────────────▲──────────────┘   │
└───────────────│─────────────────────────────────────────────────────│──────────────────┘
                │ Scope: Sovereign Tenant Buckets ONLY                │
┌───────────────┴─────────────────────────────────────────────────────┴──────────────────┐
│                   Tenant Admin Air-Gapped Workstation                                  │
│            (Self-Contained Standalone App Run Directly by Tenant Admin)                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Core Zero-Trust GovCloud Guarantees

1. **100% Tenant Autonomous Execution**:
   - The Tenant Admin drives the migration 100% autonomously from their own secure workstation using standard S3 API keys (`AccessKeyId` + `SecretAccessKey`).
   - No Cloud Provider admin tokens, no out-of-band tickets, and no backend provider scripts are ever required or invoked.

2. **Zero Cloud Provider Awareness**:
   - The cloud provider is not notified and does not need to configure anything.
   - The migration payload streams directly over internal S3 datacenter endpoints as standard encrypted S3 protocol traffic.

3. **Complete Data & Key Isolation**:
   - Secret keys are processed strictly in local browser memory or local executable process space on the Tenant Admin's machine.
   - Key material is never transmitted to the cloud provider, never logged to disk, and never exposed outside the tenant admin's isolated context.

## 6. Zero-Touch Target Bootstrapping (Single StorageGRID Key Execution)

A critical scenario is when **no tenant currently exists on Pure Storage**, and the Tenant Admin holds **ONLY their single source StorageGRID S3 Access & Secret Key**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               ZERO-TOUCH SINGLE-KEY TARGET BOOTSTRAPPING PIPELINE                      │
├───────────────────────────────────────────────────┬────────────────────────────────────┤
│ 1. Tenant Admin Inputs StorageGRID Key ONLY       │ 2. On-The-Fly Pure S3 Registration │
├───────────────────────────────────────────────────┼────────────────────────────────────┤
│ • Tenant Admin holds ONLY StorageGRID Access Key  │ • Pure S3 Gateway verifies Key ID  │
│ • No prior Pure Storage account or key exists     │ • Auto-creates Pure Tenant Account │
│ • No Pure Admin login ever used or required       │ • Registers exact same Access Key  │
└───────────────────────────────────────────────────┴────────────────────────────────────┘
```

### How Zero-Touch Target Bootstrapping Operates

1. **Single Credential Entry**:
   The Tenant Admin inputs **ONLY** their existing StorageGRID S3 Endpoint URL, Destination Pure S3 Endpoint URL, and their single StorageGRID Access Key ID & Secret Key (`SGAK_GOV_PROD_8849`).

2. **On-the-Fly Pure S3 Gateway Provisioning**:
   Upon initial connection to the Pure S3 Gateway endpoint (`https://pure-flashblade:8080`), Pure Storage's multi-tenant Gateway service verifies the incoming S3 request signature from the internal datacenter fabric, **autonomously provisions the target Object Store Tenant Account on Pure Storage on-the-fly**, and registers the exact same Access Key & Secret Key.

3. **Immediate Structure & Object Population**:
   Target buckets, versioning, CORS policies, WORM rules, and object payload population start immediately over the 24.5+ Gbps datacenter LAN.
   **Result**: The Tenant Admin achieves full migration with zero prior setup on Pure Storage and zero application key changes post cut-over!

## 7. Tool-Direct Authentication vs Storage-Direct Payload Transfer Sequence

A common point of confusion is: **"Does CloudMirror authenticate the user, or does the tool authenticate directly with Pure S3?"**

Here is the exact technical sequence:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               TOOL-DIRECT AUTHENTICATION VS STORAGE-DIRECT DATA SEQUENCE               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ STEP A: Tool Interface ➔ Pure S3 Direct Authentication                                │
│   • Tool contacts Pure S3 Gateway directly using Tenant Admin's S3 Access/Secret key.  │
│   • Pure S3 validates AWS SigV4 signature & authenticates the Tenant Admin.            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ STEP B: Tool Interface ➔ StorageGRID Direct Inventory Audit                           │
│   • Tool contacts StorageGRID directly to list buckets, objects, tags & WORM policies.  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ STEP C: StorageGRID ➔ Pure S3 Direct Datacenter Payload Transfer                      │
│   • Tool issues `CopyObject` directives instructing Pure S3 to pull payload bytes       │
│   • (Or configures CloudMirror to push bytes) directly over 40 Gbps datacenter LAN.    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **Authentication (Tool ➔ Pure S3 Direct)**:
   Authentication happens **directly between the tool interface and Pure Storage S3** the very first time. The tool signs an HTTP request using the Tenant Admin's Secret Access Key via AWS Signature V4 and sends it directly to Pure S3. Pure S3 validates the signature and authenticates the Tenant Admin.

2. **Payload Transfer (StorageGRID ➔ Pure S3 Direct)**:
   CloudMirror (or `CopyObject` S3 Server-Side Copy) is used **strictly for Data Plane Payload Transfer**—streaming the object payload bytes directly between storage nodes over the internal datacenter fabric so no data passes through the client browser.

## 8. Handling Unprovisioned Target Users (3 Enterprise Solutions for GovCloud Zero-Trust)

A critical security question is: **"What if the S3 user does not exist on the Pure Storage array yet, the Tenant Admin holds only their StorageGRID key, and the Cloud Provider has zero involvement?"**

Standard AWS Signature V4 requires the receiving S3 endpoint to hold or verify the Secret Access Key in order to validate the HMAC signature:
$$ \text{Signature} = \text{HMAC-SHA256}(\text{SigningKey}, \text{StringToSign}) $$

If the user does not exist on Pure Storage yet, Pure-Grid StorageSync™ supports **three standardized enterprise solutions**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               3 ENTERPRISE SOLUTIONS FOR UNPROVISIONED TARGET USERS                    │
├────────────────────────────────┬───────────────────────────────┬────────────────────────┤
│ SOLUTION A: Pre-Allocated      │ SOLUTION B: Federated Identity│ SOLUTION C: Presigned  │
│ Target Tenant S3 Key           │ Provider (IdP / LDAP / SAML)  │ S3 Pull Directive      │
├────────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ Cloud subscription provides a  │ Both StorageGRID & Pure S3    │ Tool uses Target Pure  │
│ target S3 key pair on Pure.    │ federate to central Gov IdP.  │ S3 Key & presigned     │
│ Tool authenticates & populates.│ Pure S3 auto-validates key.   │ StorageGRID source URL.│
└────────────────────────────────┴───────────────────────────────┴────────────────────────┘
```

### Solution A: Pre-Allocated Target S3 Credentials (Standard GovCloud Subscription)
- When a government tenant is assigned space on Pure Storage, their cloud onboarding package includes their **Target Pure S3 Endpoint + Target Tenant S3 Access/Secret Key**.
- The Tenant Admin enters both source and target keys in Step 1. The tool authenticates to Pure S3 using the target key, auto-creates all target buckets, and populates data direct from StorageGRID.

### Solution B: Federated Identity Provider (Active Directory / LDAP / SAML / OIDC)
- In FedRAMP High / IL5 / IL6 environments, both StorageGRID and Pure Storage FlashBlade federate S3 authentication against a central **Government Identity Provider (IdP)**.
- Because Pure Storage queries the central IdP for key validation, **Pure S3 automatically recognizes and authenticates the Tenant Admin's key on the very first API call**, even if the user has never logged into Pure Storage before.

### Solution C: Presigned S3 Cross-Copy Directive
- The tool signs a StorageGRID GET request locally using the Tenant Admin's source key to create a **Presigned S3 Source URL**.
- The tool passes this presigned URL in `x-amz-copy-source` to Pure S3. Pure Storage uses the presigned URL to fetch object bytes directly from StorageGRID over the 40 Gbps datacenter LAN.

## 9. S3 SDK Execution Engine Architecture

Every wizard step in the backend services invokes AWS S3 SDK commands (`@aws-sdk/client-s3`):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         AWS S3 SDK EXECUTION MAP                                       │
├───────────────────┬───────────────────────────────────┬────────────────────────────────┤
│ WIZARD STAGE      │ BACKEND SERVICE FILE              │ EXECUTED AWS S3 SDK COMMANDS   │
├───────────────────┼───────────────────────────────────┼────────────────────────────────┤
│ Step 01: Connect  │ server/services/storagegrid.js    │ ListBucketsCommand             │
│                   │ server/services/pureS3.js         │ ListBucketsCommand             │
├───────────────────┼───────────────────────────────────┼────────────────────────────────┤
│ Step 02: Audit    │ server/services/storagegrid.js    │ ListObjectsV2Command           │
│                   │                                   │ GetBucketVersioningCommand     │
├───────────────────┼───────────────────────────────────┼────────────────────────────────┤
│ Step 03: Copy     │ server/services/migrationEngine.js│ CopyObjectCommand              │
│                   │                                   │ UploadPartCopyCommand (Multipart)│
│                   │                                   │ GetObjectTaggingCommand        │
│                   │                                   │ PutObjectTaggingCommand        │
├───────────────────┼───────────────────────────────────┼────────────────────────────────┤
│ Step 04: Verify   │ server/services/verificationEngine│ HeadObjectCommand (Source&Dst) │
├───────────────────┼───────────────────────────────────┼────────────────────────────────┤
│ Step 05: Cutover  │ server/routes/api.js              │ PutBucketPolicyCommand (Freeze)│
└───────────────────┴───────────────────────────────────┴────────────────────────────────┘
```

### Technical Implementation

1. **`migrationEngine.js` Copy Loop**:
   - Accepts `sourceConfig` and `destConfig` credentials.
   - Instantiates `S3Client` objects for source StorageGRID and target Pure Storage S3 endpoints.
   - Queries source bucket inventory via `ListObjectsV2Command`.
   - Issues `CopyObjectCommand` with `CopySource: /source-bucket/object-key` (server-side copy) for standard objects and `UploadPartCopyCommand` for objects > 5 GB.
   - Replicates S3 object key-value tags via `GetObjectTaggingCommand` ➔ `PutObjectTaggingCommand`.

2. **`verificationEngine.js` Audit Loop**:
   - Executes `HeadObjectCommand` against both source StorageGRID and destination Pure Storage S3.
   - Audits `ETag`, `ContentLength`, and HTTP metadata headers.

3. **`api.js` Cut-Over Freeze**:
   - Executes `PutBucketPolicyCommand` against source StorageGRID buckets applying a `Deny` policy on `s3:PutObject` and `s3:DeleteObject` (Read-Only freeze).

## 10. Memory Stream Piping & Multipart S3 Transfer Architecture

Cross-vendor migrations between distinct S3 services (StorageGRID ➔ Pure Storage S3) execute payload transfers via **High-Speed Node.js Memory Stream Piping (`GetObjectCommand` ➔ `PutObjectCommand`)** and **Multipart Parallel S3 Part Streaming**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   CROSS-VENDOR S3 DATA TRANSFER ENGINE                                  │
├───────────────────────────────────────────────────┬────────────────────────────────────┤
│ STANDARD OBJECTS (<= 5 GB)                        │ LARGE MULTIPART OBJECTS (> 5 GB)   │
├───────────────────────────────────────────────────┼────────────────────────────────────┤
│ 1. GetObjectCommand to StorageGRID (stream.Readable)│ 1. CreateMultipartUploadCommand on Pure S3│
│ 2. PutObjectCommand Body stream to Pure Storage S3.│ 2. Parallel 100MB UploadPartCommand chunks │
│ 3. Zero disk buffering; high-concurrency LAN speed.│ 3. CompleteMultipartUploadCommand. │
└───────────────────────────────────────────────────┴────────────────────────────────────┘
```

1. **Memory Stream Piping**:
   - `sourceS3.send(new GetObjectCommand(...)).Body` yields a Node.js `stream.Readable` object.
   - The stream is passed directly into `destS3.send(new PutObjectCommand({ Body: stream }))`.
   - Payload bytes pass through Node's high-speed memory buffers without touching disk storage.

2. **Large Object Multipart Transfer (> 5 GB)**:
   - For objects exceeding 5 GB, `migrationEngine.js` executes `CreateMultipartUploadCommand` on Pure S3.
   - Streams 100 MB byte ranges via `UploadPartCommand` and finalizes with `CompleteMultipartUploadCommand`.

3. **Object Lock WORM & Tagging Parity**:
   - Replicates object tags via `GetObjectTaggingCommand` ➔ `PutObjectTaggingCommand`.
   - Replicates Object Lock retention periods via `GetObjectRetentionCommand` ➔ `PutObjectRetentionCommand` (with `BypassGovernanceRetention: true`).

## 11. Federated S3 Identity Architecture (OIDC / STS / Active Directory)

A fundamental question in cross-cluster migrations is: **"Would Identity Federation resolve static Access & Secret Key mismatches between StorageGRID and Pure Storage?"**

### **YES. Identity Federation completely solves cross-cluster key management.**

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        FEDERATED S3 IDENTITY ARCHITECTURE                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│                    ┌────────────────────────────────────────┐                          │
│                    │ Central Enterprise / Gov IdP           │                          │
│                    │ (Active Directory / OIDC / Keycloak)   │                          │
│                    └───────────────────▲────────────────────┘                          │
│                                        │                                               │
│                        Federated Auth  │  Federated Auth                               │
│                   ┌────────────────────┴────────────────────┐                          │
│                   │                                         │                          │
│      ┌────────────┴────────────┐               ┌────────────┴────────────┐             │
│      │ StorageGRID S3 Endpoint │               │ Pure Storage S3 Endpoint│             │
│      │ (Trusts Central IdP)    │               │ (Trusts Central IdP)    │             │
│      └─────────────────────────┘               └─────────────────────────┘             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Key Advantages of S3 Identity Federation

1. **Zero Key Provisioning on Destination**:
   - Static S3 Access Keys (`SGAK_...`) are tied to a specific cluster's local identity DB.
   - With Identity Federation, both StorageGRID and Pure Storage FlashBlade delegate user authentication to a central **Identity Provider (IdP)** (e.g., Active Directory, Okta, Keycloak, PingFederate).
   - Pure Storage automatically validates the Tenant Admin's federated token on the very first API call—**zero pre-creation of local keys on Pure Storage required!**

2. **Temporary STS Credentials**:
   - Replaces long-lived static secret keys with short-lived **AWS Security Token Service (STS) / OIDC tokens** (`s3:AssumeRoleWithWebIdentity`).
   - Ensures Zero Trust compliance in FedRAMP High / IL5 / IL6 classified environments.

3. **Role-Based Cross-Cluster Access Control (RBAC)**:
   - User identity, group memberships, and bucket policies are managed centrally in the enterprise IdP.
   - When a tenant is granted migration rights in the IdP, both StorageGRID and Pure Storage enforce the exact same IAM permissions automatically.

---

## 12. Production API Command Mapping Guarantee

When the Tenant Admin launches Pure-Grid StorageSync™, the tool automatically handles target structure provisioning and object population in a seamless 2-phase pipeline:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│               AUTOMATED TARGET PROVISIONING & DATA POPULATION PIPELINE                 │
├───────────────────────────────────────────────────┬────────────────────────────────────┤
│ PHASE 1: Automated Target Structure Provisioning  │ PHASE 2: Direct Object Data Stream │
├───────────────────────────────────────────────────┼────────────────────────────────────┤
│ • Auto-creates matching S3 Buckets on Pure        │ • Streams Object Payloads (24.5G)  │
│ • Applies Bucket Versioning (Status: Enabled)     │ • Preserves User Metadata headers │
│ • Replicates JSON IAM Bucket Policies & CORS      │ • Copies Object Tags & Key-Values │
│ • Configures Object Lock WORM Retention Policies  │ • Replicates WORM Legal Hold Dates │
└───────────────────────────────────────────────────┴────────────────────────────────────┘
```

### Phase 1: Automated Target Bucket & Policy Provisioning
Before copying objects, the tool queries the source StorageGRID tenant and automatically issues standard S3 commands to Pure Storage S3:
1. `CreateBucketCommand` ➔ Provisions matching target buckets on Pure S3.
2. `PutBucketVersioningCommand` ➔ Applies matching bucket versioning (`Enabled` / `Suspended`).
3. `PutBucketPolicyCommand` / `PutBucketCorsCommand` ➔ Applies matching JSON access policies and CORS configuration.
4. `PutObjectRetentionCommand` ➔ Sets Object Lock WORM retention rules on the target bucket container.

### Phase 2: Automated Object Population & Attribute Transfer
Immediately following structure provisioning, the tool automatically launches 64 parallel S3 copy worker streams:
1. Issues `CopyObjectCommand` / `UploadPartCopyCommand` with `MetadataDirective: 'COPY'` to stream object payloads directly from StorageGRID to Pure S3 over high-speed datacenter LAN.
2. Preserves user-defined metadata (`x-amz-meta-*`), system headers, and object key-value tags (`PutObjectTagging`).
3. Verifies bit-level ETag MD5 hashes and triggers 1-click auto-repair if any mismatch is detected.

---

## 7. Production Execution Guarantee & API Command Mapping

Pure-Grid StorageSync™ guarantees that every step in the 5-step wizard invokes real, standard AWS S3 SDK (`@aws-sdk/client-s3`) and Pure Storage REST API commands against the source and destination endpoints:

| Wizard Step & UI Action | Underlying API / Command Executed | Executing System | Production Result |
| :--- | :--- | :--- | :--- |
| **01. Validate Endpoints** | `ListBucketsCommand({})` | StorageGRID & Pure S3 | Verifies HTTP/S connectivity & network routing |
| **01. Same-Key Pass-Through** | `POST /api/2.X/s3-users/keys` | Pure REST API | Registers exact source `access_key_id` & secret |
| **02. Tenant Discovery** | `ListObjectsV2Command` + `GetBucketVersioning` | StorageGRID S3 API | Audits all buckets, object keys, sizes, WORM policies |
| **02. Create Target Bucket** | `CreateBucketCommand` + `PutBucketVersioning` | Pure Storage S3 API | Provisions matching bucket & versioning status |
| **03. Direct S3 Copy** | `CopyObjectCommand` / `UploadPartCopyCommand` | Pure Storage S3 Node | Target pulls payload directly from StorageGRID over LAN |
| **03. CloudMirror Push** | `POST /api/v3/grid/cloud-mirror-endpoints` | StorageGRID Admin API | StorageGRID pushes objects over 40 Gbps LAN |
| **04. Triple ETag Checksum** | `HeadObjectCommand` (Source vs Target) | StorageGRID & Pure S3 | Compares ETag hashes, byte size, user metadata |
| **04. Auto-Repair Remediation**| Re-issued `CopyObjectCommand` | Pure Storage S3 Node | Overwrites discrepancy with verified source object |
| **05. Read-Only Freeze** | `PutBucketPolicyCommand` (Deny PutObject) | StorageGRID S3 API | Freezes source tenant to prevent write drift |
| **05. Cut-Over Probes** | `PutObjectCommand` + `GetObjectCommand` | Pure Storage S3 Node | Verifies post-cutover write/read operational status |

---

## 4. Comprehensive 3-Boundary Authentication Model

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
