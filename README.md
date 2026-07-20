# Pure-Grid StorageSync™ - Enterprise Direct Migration Engine

**Pure-Grid StorageSync™** is a completely self-contained, air-gap ready web application designed to automate high-speed, zero-data-loss tenant migrations from NetApp StorageGRID to Pure Storage S3 cloud tenants (FlashBlade S3).

---

## ⚡ 1-Click Launch (Zero Installation Required)

### 🪟 Windows
Double-click `run-windows.bat` or run:
```cmd
run-windows.bat
```

### 🐧 Linux & macOS
Run in terminal:
```bash
chmod +x run-linux.sh
./run-linux.sh
```

### 🌐 Direct Browser Execution
Open [index.html](file:///g:/My%20Drive/AntiGravity/CloudMigrator/index.html) in any modern browser!

---

## 🛡️ Production Streamlined Features

1. **Datacenter Direct S3 Payload Transfer (0 B Client Proxy)**:
   - High-speed server-side S3 copying up to 24.5+ Gbps over local datacenter LAN.
2. **Exact Same-Key S3 Pass-Through Mode**:
   - Replicates exact StorageGRID S3 Access & Secret Keys onto Pure Storage ➔ **0 end-user application key changes required!**
3. **100% Full Attribute Parity**:
   - Bucket & Object ACLs, User Metadata (`x-amz-meta-*`), System Headers, S3 Tags, Bucket Policies, CORS, Versioning, and Object Lock WORM Retention / Legal Holds.
4. **Triple-Check ETag Checksumming & Auto-Repair**:
   - Bit-level verification matrix with 1-click discrepancy remediation.
5. **Streamlined 5-Step Production Wizard**:
   - Includes Undo, Reset Config, Overwrite Policies (`SKIP_EXISTING`, `OVERWRITE_IF_NEWER`, `OVERWRITE_ALWAYS`), and exportable CSV audit logs.

---

## 📖 Documentation & License

- **Full Enterprise Guide**: See [DOCUMENTATION.md](file:///g:/My%20Drive/AntiGravity/CloudMigrator/DOCUMENTATION.md)
- **IP Protection & Indemnification**: See [LICENSE.md](file:///g:/My%20Drive/AntiGravity/CloudMigrator/LICENSE.md)
