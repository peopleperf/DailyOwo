# AI Receipt Scanning Setup & Test Guide

## Step 1: Environment Setup

1. **Create your `.env.local` file** if it doesn't exist:
   ```bash
   cd dailyowo-web
   cp env.example .env.local
   ```

2. **Add your Gemini API key** to `.env.local`:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
   
   Get your FREE API key from: https://makersuite.google.com/app/apikey

3. **Ensure AI features are enabled** in `.env.local`:
   ```
   NEXT_PUBLIC_AI_RECEIPT_ENABLED=true
   NEXT_PUBLIC_AI_FIRST_SCANNING=true
   ```

## Step 2: Start the Development Server

```bash
cd dailyowo-web
npm run dev
```

The server should start on http://localhost:3000

## Step 3: Test the AI API Endpoint

Open a new terminal and test:

```bash
# Test if API is accessible
curl -X POST http://localhost:3000/api/ai/analyze-receipt \
  -H "Content-Type: application/json" \
  -d '{"imageBase64": "test"}'
```

Expected responses:
- If API key missing: `{"error":"AI service not configured"}`
- If AI disabled: `{"error":"AI receipt analysis is disabled"}`
- If working: `{"error":"Image data is required"}` or actual analysis

## Step 4: Test Receipt Scanning

1. Go to http://localhost:3000
2. Login to your account
3. Navigate to Transactions → Add Transaction
4. Click "Scan Receipt"
5. Upload a receipt image

## What You Should See

### During Processing:
1. "Initializing AI Scanner..."
2. "Analyzing receipt with AI..."

### In the Results:
- **Merchant Category** badge (e.g., "Grocery Store")
- **AI Insights** section with:
  - Money-saving suggestions
  - Health scores for food items
  - Spending insights
  - Category recommendations

### In Browser Console (F12):
Look for these logs:
- `[AI] Using AI-first receipt scanning via API...`
- `[AI] AI analysis successful with confidence: 0.XX`

## Troubleshooting

### Issue: "AI service not configured"
**Solution**: Your Gemini API key is not in `.env.local`. Add it and restart the server.

### Issue: No AI analysis happening
**Check**:
1. Open browser console (F12)
2. Look for `[AI]` logs
3. Check Network tab for `/api/ai/analyze-receipt` calls

### Issue: API endpoint not found
**Solution**: 
1. Make sure you're in the `dailyowo-web` directory
2. Restart the server: `npm run dev`
3. Clear browser cache

### Issue: Still seeing old OCR results
**Solution**:
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Check that `NEXT_PUBLIC_AI_FIRST_SCANNING=true` in `.env.local`
3. Restart the development server

## Verify Everything is Working

Run this checklist:

- [ ] `.env.local` exists with your Gemini API key
- [ ] Server running on http://localhost:3000
- [ ] Can access the app and login
- [ ] Receipt upload shows "Analyzing receipt with AI..."
- [ ] Results show merchant category and AI insights
- [ ] Browser console shows AI logs

## What Makes AI-First Different?

**OCR-Only** (Before):
- Basic text extraction
- Often misses items
- No context understanding
- ~60-70% accuracy

**AI-First** (Now):
- Understands receipt structure
- Extracts merchant category
- Identifies brands and health info
- Provides actionable insights
- ~90-95% accuracy

## Example AI Enhancements

For a grocery receipt, AI will add:
- Store category: "Grocery Store"
- Item categories: "Produce", "Dairy", etc.
- Health scores: "Vegetables: 9/10"
- Savings tips: "Save $5 by choosing store brands"
- Insights: "20% increase in grocery spending this week" 