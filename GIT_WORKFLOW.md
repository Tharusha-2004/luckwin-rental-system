# Git Workflow Guide - Luckwin Stores

## Current Status ✅

- **Repository**: https://github.com/Tharusha-2004/luckwin-rental-system.git
- **Branch**: main
- **Status**: All 40 files committed and pushed
- **Last Commit**: Initial commit with full system (Commit: 2c282d8)

---

## 🔄 Workflow for Future Changes

### After Making Code Changes

**Step 1: Check what changed**
```bash
cd "e:\New folder\luckwin"
git status
```

**Step 2: Stage all changes**
```bash
git add .
```

**Step 3: Commit with descriptive message**
```bash
git commit -m "Feature: Brief description of what changed

- Detailed change 1
- Detailed change 2
- Detailed change 3"
```

**Step 4: Push to GitHub**
```bash
git push origin main
```

---

## 📝 Commit Message Format

### Good Commit Messages

**Feature Addition:**
```
Feature: Add email notifications for overdue rentals

- Implemented nodemailer integration
- Created email template for overdue reminders
- Added scheduled task to send daily reminders
```

**Bug Fix:**
```
Fix: Correct cost calculation for partial days

- Fixed rounding issue in day calculation
- Updated test cases
- Verified with sample data
```

**Documentation:**
```
Docs: Update API documentation with examples

- Added cURL examples for all endpoints
- Added Postman collection link
- Clarified request/response formats
```

**Refactor:**
```
Refactor: Simplify rental calculation logic

- Extracted calculation to separate function
- Improved code readability
- Maintained backward compatibility
```

---

## 🚀 Quick Commands

### Clone the repository (first time only)
```bash
git clone https://github.com/Tharusha-2004/luckwin-rental-system.git
cd luckwin-rental-system
```

### Pull latest changes
```bash
git pull origin main
```

### View commit history
```bash
git log --oneline
```

### View specific file changes
```bash
git diff backend/server.js
```

### Undo last commit (keep changes)
```bash
git reset --soft HEAD~1
```

### Undo last commit (discard changes)
```bash
git reset --hard HEAD~1
```

---

## 📊 Common Scenarios

### Scenario 1: Backend API Changes

```bash
# Make changes to backend files
cd backend
# Edit controllers, models, or routes

# Go back to project root
cd ..

# Commit
git add backend/
git commit -m "API: Add new endpoint for rental statistics

- Created GET /api/rentals/stats endpoint
- Added filtering by date range
- Implemented caching for performance"

# Push
git push origin main
```

### Scenario 2: Frontend Component Changes

```bash
# Make changes to frontend
cd frontend/src/pages

# Go back to project root
cd ../../../

# Commit
git add frontend/src/
git commit -m "UI: Enhance customer search with filters

- Added city and company name filters
- Improved search performance
- Added clear filters button"

# Push
git push origin main
```

### Scenario 3: Multiple Files Changed

```bash
# Make changes across multiple files
# Edit backend AND frontend

# Stage all changes
git add .

# Commit with clear message
git commit -m "Feature: Implement SMS notifications

- Backend: Added SMS service integration
- Frontend: Added SMS toggle in settings
- Docs: Updated notification documentation"

# Push
git push origin main
```

### Scenario 4: Bug Fix

```bash
# Found and fixed a bug
git add .

git commit -m "Fix: Resolve available quantity update issue

- Item availability now updates immediately on rental
- Fixed transaction rollback on error
- Added test case for edge case"

git push origin main
```

---

## 🔍 Branch Strategy (Optional Future Use)

If you want to work on features separately before merging:

```bash
# Create new feature branch
git checkout -b feature/new-feature-name

# Make changes
git add .
git commit -m "Feature: Description"

# Push feature branch
git push origin feature/new-feature-name

# Later, merge back to main via GitHub PR
```

---

## 📋 Checklist Before Commit

- [ ] Code tested and working
- [ ] No console errors
- [ ] No node_modules or .env files committed
- [ ] Clear commit message describing changes
- [ ] Related documentation updated (if needed)
- [ ] API endpoints tested (if backend change)
- [ ] UI looks good (if frontend change)

---

## 🛡️ Important Notes

### Never commit these files:
```
node_modules/
.env (use .env.example instead)
.DS_Store
*.log
.idea/
dist/
build/
```

### Already configured in .gitignore:
- Node modules
- Environment files
- Build outputs
- IDE files
- System files

---

## 📞 Troubleshooting Git Issues

### "Permission denied" error

**Solution**: Use HTTPS URL (already configured) or set up SSH keys

```bash
# Check your remote URL
git remote -v

# If using SSH, update to HTTPS
git remote set-url origin https://github.com/Tharusha-2004/luckwin-rental-system.git
```

### "Everything up to date" but changes not showing

```bash
# Verify status
git status

# If untracked files exist, stage them
git add .
git commit -m "Your message"
git push
```

### Need to undo changes

```bash
# Undo all local changes
git checkout -- .

# Or reset to last commit
git reset --hard HEAD
```

---

## 📈 Viewing Project on GitHub

Visit: **https://github.com/Tharusha-2004/luckwin-rental-system**

You can view:
- All commits and history
- File changes
- Lines added/removed
- Contributors
- Branches and releases

---

## 🎯 Next Commits to Make

After you make changes, use these commit message templates:

### For API/Backend Changes:
```
Feature: [Feature Name]

- Change 1
- Change 2

Fixes: [Issue number if applicable]
```

### For UI/Frontend Changes:
```
UI: [Component/Page Name]

- Visual change 1
- Functional improvement 2

Related to: [Issue number if applicable]
```

### For Bug Fixes:
```
Fix: [Issue Description]

- Root cause analysis
- Solution implemented
- Verification steps
```

### For Documentation:
```
Docs: [Section Updated]

- What changed
- Why it was needed
```

---

## 📚 Useful Git Resources

- Official Git Documentation: https://git-scm.com/doc
- GitHub Guides: https://guides.github.com
- Commit message best practices: https://www.conventionalcommits.org/

---

## ✅ You're All Set!

Your Luckwin project is now on GitHub with:
- ✅ 40 files committed
- ✅ Complete documentation
- ✅ Full backend and frontend code
- ✅ Ready for collaboration

**Happy coding! 🚀**

Make your changes, commit regularly with clear messages, and push to GitHub.
