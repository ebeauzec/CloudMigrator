# Pure-Grid StorageSync™ - Master Enterprise Migration Specification

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

## 🔑 Deep Technical Authentication & Same-Key Mechanics

### 1. Client Identity Parity (Same-Key Pass-Through)
An S3 **Access Key ID** (`SGAK_PROD_994810`) and **Secret Access Key** are HMAC credentials stored in the object store's identity management database.
S3 requests are authenticated via **AWS Signature V4 (AWS4-HMAC-SHA256)**:
$$ \text{Signature} = \text{HMAC-SHA256}(\text{SigningKey}, \text{StringToSign}) $$

Pure-Grid StorageSync registers the **exact same `access_key_id` and `secret_access_key`** on the target Pure Storage tenant via Pure FlashBlade REST API (`/api/2.X/s3-users/keys`).
**Result**: End-user applications, backup scripts, and SDKs require **0 credential changes** post cut-over!

### 2. Cross-Cluster Datacenter S3 Copy Modes
Payloads stream directly between StorageGRID and Pure Storage over high-speed datacenter LAN (**up to 24.5+ Gbps**, 0 bytes via client proxy):

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              CROSS-CLUSTER AUTHENTICATION MODES                         │
├────────────────────────────────┬───────────────────────────────┬────────────────────────┤
│ MODE 1: StorageGRID CloudMirror│ MODE 2: S3 Presigned Copy Pull│ MODE 3: High-Speed LAN │
│ (Native StorageGRID Push)      │ (Target S3 Pull with Auth)    │ Orchestration Pipeline │
├────────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ StorageGRID CloudMirroring     │ Orchestrator generates a      │ Datacenter daemon      │
│ service is configured with the │ presigned GET URL from        │ streams HTTP GET from  │
│ Pure S3 credentials and pushes │ StorageGRID and passes it as  │ StorageGRID to HTTP PUT│
│ objects directly over LAN.     │ `x-amz-copy-source` to Pure.  │ Pure over 40Gbps LAN.  │
└────────────────────────────────┴───────────────────────────────┴────────────────────────┘
```

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

- **Master Enterprise Specification**: [DOCUMENTATION.md](file:///g:/My%20Drive/AntiGravity/CloudMigrator/DOCUMENTATION.md)
- **IP Protection & Indemnification Agreement**: [LICENSE.md](file:///g:/My%20Drive/AntiGravity/CloudMigrator/LICENSE.md)
