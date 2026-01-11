# 🚀 GSoC Organizations Public API

**Version:** v1.0.0  
**Status:** ✅ Production Ready  
**Date:** December 17, 2025

---

## 📚 Documentation

**→ Read the complete documentation: [`API_COMPLETE_DOCS.md`](./API_COMPLETE_DOCS.md)**

This file contains everything you need:
- Quick start guide
- Complete endpoint reference
- Pagination guide
- Testing instructions
- Code examples
- Deployment guide
- Best practices

---

## ⚡ Quick Start

### 1. Start the Server

```bash
pnpm dev
```

### 2. Test the API

```bash
# Health check
curl http://localhost:3000/api/v1/health

# List organizations
curl http://localhost:3000/api/v1/organizations?limit=5

# Get statistics
curl http://localhost:3000/api/v1/stats
```

### 3. Test Pagination

```bash
node scripts/test-pagination.js
```

---

## 🎯 What's Built

### 12 API Endpoints

✅ **Organizations** - List, search, filter 500+ GSoC organizations  
✅ **Years** - Historical data and statistics (2016-2025)  
✅ **Projects** - Browse 12,000+ GSoC projects  
✅ **Tech Stack** - Explore technologies and usage  
✅ **Statistics** - Platform insights and analytics  
✅ **Health & Meta** - Monitoring and documentation  

### Key Features

- ✅ **REST API** - Standard REST conventions
- ✅ **Paginated** - Efficient data loading (20-100 items/page)
- ✅ **Filtered** - Search, sort, filter by year/tech/category
- ✅ **Cached** - CDN-friendly with long cache times
- ✅ **Versioned** - Stable v1 contract (`/api/v1`)
- ✅ **Read-only** - Safe for public access
- ✅ **No Auth** - Freely accessible

---

## 📊 Endpoints Summary

| Endpoint | Method | Description | Paginated |
|----------|--------|-------------|-----------|
| `/api/v1` | GET | API welcome | No |
| `/api/v1/health` | GET | Health check | No |
| `/api/v1/meta` | GET | API metadata | No |
| `/api/v1/organizations` | GET | List organizations | ✅ Yes |
| `/api/v1/organizations/{slug}` | GET | Organization details | No |
| `/api/v1/years` | GET | List years | No |
| `/api/v1/years/{year}/organizations` | GET | Orgs by year | ✅ Yes |
| `/api/v1/years/{year}/stats` | GET | Year statistics | No |
| `/api/v1/projects` | GET | List projects | ✅ Yes |
| `/api/v1/projects/{id}` | GET | Project details | No |
| `/api/v1/tech-stack` | GET | List technologies | No |
| `/api/v1/tech-stack/{slug}` | GET | Orgs by tech | ✅ Yes |
| `/api/v1/stats` | GET | Overall statistics | No |

---

## ⚠️ Important: Pagination

**Organizations and Projects are PAGINATED!**

- **Default:** 20 items per page
- **Maximum:** 100 items per page
- **Response includes:** `{ total, pages, page, limit }`

To get all data, you must loop through all pages. See [`API_COMPLETE_DOCS.md`](./API_COMPLETE_DOCS.md#pagination-guide) for details.

---

## 🧪 Testing

### Run Test Script

```bash
# Test pagination (shows actual database counts)
node scripts/test-pagination.js

# Test all endpoints
bash scripts/test-api.sh
```

### Manual Testing

```bash
# Organizations
curl "http://localhost:3000/api/v1/organizations?limit=5"
curl "http://localhost:3000/api/v1/organizations?technology=python"
curl "http://localhost:3000/api/v1/organizations/mozilla"

# Years
curl "http://localhost:3000/api/v1/years"
curl "http://localhost:3000/api/v1/years/2024/organizations"
curl "http://localhost:3000/api/v1/years/2024/stats"

# Projects
curl "http://localhost:3000/api/v1/projects?q=web&limit=5"
curl "http://localhost:3000/api/v1/projects?year=2024&org=mozilla"

# Tech Stack
curl "http://localhost:3000/api/v1/tech-stack?min_usage=10"
curl "http://localhost:3000/api/v1/tech-stack/python"

# Statistics
curl "http://localhost:3000/api/v1/stats"
```

---

## 🌐 Deployment

### Vercel (Recommended)

```bash
vercel --prod
```

### Railway

Connect GitHub repo → Add `DATABASE_URL` → Deploy

### Fly.io

```bash
fly launch
fly secrets set DATABASE_URL="..."
fly deploy
```

After deployment, update base URL from `localhost:3000` to your production domain.

---

## 📂 Files Structure

```
gsoc-orgs/
├── app/api/v1/                     # API routes (12 endpoints)
│   ├── route.ts                    # API root
│   ├── health/route.ts             # Health check
│   ├── meta/route.ts               # API metadata
│   ├── organizations/              # Organizations endpoints
│   ├── years/                      # Years endpoints
│   ├── projects/                   # Projects endpoints
│   ├── tech-stack/                 # Tech stack endpoints
│   └── stats/route.ts              # Statistics endpoint
│
├── scripts/
│   ├── test-pagination.js          # Pagination test script
│   └── test-api.sh                 # Full API test suite
│
├── API_COMPLETE_DOCS.md            # ⭐ Complete documentation
└── API_README.md                   # This file
```

---

## 💡 Quick Examples

### JavaScript/TypeScript

```typescript
// Fetch organizations
const response = await fetch('/api/v1/organizations?technology=python&limit=20');
const data = await response.json();

if (data.success) {
  console.log(`Total: ${data.data.pagination.total}`);
  console.log(`Organizations:`, data.data.organizations);
}
```

### Python

```python
import requests

response = requests.get('http://localhost:3000/api/v1/stats')
stats = response.json()['data']
print(f"Total organizations: {stats['overview']['total_organizations']}")
```

### React

```tsx
function OrganizationsList() {
  const [orgs, setOrgs] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`/api/v1/organizations?page=${page}&limit=20`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOrgs(data.data.organizations);
        }
      });
  }, [page]);

  return (
    <div>
      {orgs.map(org => (
        <div key={org.slug}>{org.name}</div>
      ))}
      <button onClick={() => setPage(page + 1)}>Next Page</button>
    </div>
  );
}
```

---

## 🎓 Learning Resources

1. **Start here:** [`API_COMPLETE_DOCS.md`](./API_COMPLETE_DOCS.md) - Read the complete documentation
2. **Test it:** Run `node scripts/test-pagination.js` to see real data
3. **Play around:** Try different endpoints and parameters
4. **Build something:** Integrate into your frontend/backend

---

## 🐛 Troubleshooting

### Server not responding?

```bash
# Check if server is running
curl http://localhost:3000/api/v1/health

# If not, start it
pnpm dev
```

### Getting errors?

```bash
# Clear Next.js cache and restart
rm -rf .next
pnpm dev
```

### Want to see database counts?

```bash
node scripts/test-pagination.js
```

---

## 📋 Checklist Before Deployment

- [ ] Test all endpoints locally
- [ ] Run `node scripts/test-pagination.js`
- [ ] Verify `DATABASE_URL` is set
- [ ] Update base URL in any hardcoded references
- [ ] Test deployed API health check
- [ ] Update documentation with production URL

---

## 🎉 Ready to Deploy!

Your GSoC Organizations API is production-ready. All endpoints are tested, documented, and ready to serve data to the world!

**Next Steps:**
1. Deploy to Vercel/Railway/Fly.io
2. Update base URL in docs
3. Share with the community
4. Monitor usage and performance

---

**For complete documentation, see [`API_COMPLETE_DOCS.md`](./API_COMPLETE_DOCS.md)**

**Questions?** Open an issue on GitHub or check the documentation.

---

**Built with ❤️ for the open-source community**

