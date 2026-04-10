# Product Image Upload Implementation

## Summary of Changes

Fixed the product image display and storage in the HABANA SPORT application by implementing proper file upload handling instead of relying on base64 encoding.

## Backend Changes (backend/src/server.js)

### 1. Added Required Imports
- Added `multer` for file upload handling
- Added `path` for file path manipulation
- Added `fs` for file system operations

```javascript
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
```

### 2. Updated Middleware Configuration
- Increased JSON body size limit to 50MB to support larger requests
- Added URL-encoded parser with 50MB limit

```javascript
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
```

### 3. Added Static File Serving
- Created `/uploads` directory to store uploaded images
- Configured Express to serve static files from `/uploads` path

```javascript
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));
```

### 4. Configured Multer Storage
- Set up disk storage with timestamps and random filenames to prevent collisions
- Limited file size to 5MB
- Validated file types (JPEG, PNG, WebP, GIF only)

```javascript
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Chỉ cho phép file ảnh JPG, PNG, WebP, GIF'));
  }
});
```

### 5. Added Upload Endpoint
- New route: `POST /api/upload`
- Requires authentication and admin privileges
- Returns the image URL that can be stored in the database

```javascript
app.post('/api/upload', authMiddleware, adminOnly, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Không có file ảnh' });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl, filename: req.file.filename });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi upload', error: err.message });
  }
});
```

## Frontend Changes

### 1. Updated API Module (frontend/src/api.js)
- Added new `uploadAPI` object with `image()` function
- Uses FormData to send files as multipart form data
- Handles file upload and returns the image URL

```javascript
export const uploadAPI = {
  image: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = getToken();
    return fetch(`${BASE}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
      .then(res => res.json())
      .then(data => {
        if (!data.url) throw new Error(data.message || 'Lỗi upload');
        return data;
      });
  },
};
```

### 2. Updated App Component Import
- Added `uploadAPI` to the import statement

```javascript
import { authAPI, uploadAPI, productAPI, categoryAPI, orderAPI, adminAPI, paymentAPI, saveToken, clearToken, hasToken } from "./api";
```

### 3. Added Upload State Management
- Added `uploadingFile` and `editUploadingFile` states to track upload progress

```javascript
const [uploadingFile, setUploadingFile] = useState(false);
const [editUploadingFile, setEditUploadingFile] = useState(false);
```

### 4. Updated Product Form File Upload Handler (Create)
- Replaced base64 encoding with proper file upload
- Calls `uploadAPI.image()` when user selects a file
- Shows upload progress feedback with "⏳ Đang upload..."
- Displays success/error toast notifications

```javascript
<input type="file" accept="image/*" onChange={async e=>{
  const file=e.target.files?.[0];
  if(file){
    setUploadingFile(true);
    try{
      const {url}=await uploadAPI.image(file);
      setNewP(p=>({...p,image:url}));
      setImagePreview(url);
      showToast("✅ Upload ảnh thành công!","success");
    }catch(err){
      showToast("❌ "+err.message,"error");
    }finally{
      setUploadingFile(false);
    }
  }
}} style={{marginTop:8,padding:"8px",border:"1.5px solid var(--b)",borderRadius:8,width:"100%",fontSize:13,cursor:"pointer"}} disabled={uploadingFile}/>
```

### 5. Updated Product Form File Upload Handler (Edit)
- Similar implementation for editing products
- Uses `editUploadingFile` state for upload progress

### 6. Updated Image Display Logic
- Updated all image display locations to recognize `/uploads` paths in addition to `data:` and `http`
- Ensures images from the new upload endpoint display correctly

Changed display conditions from:
```jsx
p.image.startsWith('data:') || p.image.startsWith('http')
```

To:
```jsx
p.image.startsWith('data:') || p.image.startsWith('http') || p.image.startsWith('/uploads')
```

Updated in 4 locations:
1. Admin dashboard product list
2. Product showcase (first 3 products)
3. Full product listing
4. Shopping cart item display

## Benefits of This Implementation

1. **Better Performance**: Images are served directly from disk instead of being processed as base64 strings
2. **Database Efficiency**: Stores only image paths (e.g., `/uploads/1234567890-abc.jpg`) instead of large base64 strings
3. **Security**: Only admin users can upload images, and file types are validated
4. **Reliability**: File uploads are properly handled with error feedback to users
5. **Scalability**: Can handle larger images (up to 5MB) without affecting database size
6. **User Feedback**: Loading state and toast notifications show upload progress and results

## Directory Structure

```
backend/
├── src/
│   └── server.js          // Updated with upload endpoint
├── uploads/               // New directory for storing uploaded images
│   └── .gitkeep           // Ensures directory is tracked in git
├── database/
│   ├── migrate.js         // No changes needed
│   └── seed.js            // No changes needed
└── package.json           // No changes (multer already installed)

frontend/
└── src/
    ├── api.js             // Updated with uploadAPI
    └── App.jsx            // Updated with file upload handlers and image display logic
```

## Testing the Implementation

1. **Start the backend server** (if not already running):
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend server** (if not already running):
   ```bash
   cd frontend
   npm run dev
   ```

3. **Log in as admin**:
   - Email: `admin@habana.vn`
   - Password: `admin123`

4. **Test image upload**:
   - Go to Admin Panel → Products → "Thêm Sản Phẩm"
   - Select a product image file (JPG, PNG, WebP, or GIF)
   - Wait for the "✅ Upload ảnh thành công!" success message
   - The image URL will automatically be filled in the image field
   - Save the product to verify the image is stored in the database

5. **Verify image display**:
   - Check the product card in the admin dashboard
   - Browse products on the home page
   - Add product to cart and verify image displays in cart

## Image URL Storage

When a product is saved, the `image` field in the database will contain values like:
- `/uploads/1704067200000-abc123def.jpg` (from file upload)
- `https://example.com/image.jpg` (from URL paste)
- `🏋️` (emoji fallback for legacy products)

All three formats are supported and displayed correctly.
