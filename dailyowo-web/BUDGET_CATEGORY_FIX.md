# Budget Category Undefined Field Value Fix

## Problem
When adding a new budget category, the following error occurred:
```
FirebaseError: Function updateDoc() called with invalid data. 
Unsupported field value: undefined (found in document users/.../budgets/budget-...)
```

## Root Cause
The issue was caused by undefined values being passed to Firestore's `updateDoc` function:

1. In `BudgetCategoryModal`, when adding a new category, the code included `id: category?.id` where `category` was null for new categories
2. This resulted in `id: undefined` being included in the data
3. The spread operator in `BudgetCategoriesTab` was then overwriting valid fields with undefined values
4. Firestore rejects documents with undefined field values

## Solutions Implemented

### 1. Fixed BudgetCategoryModal
- Modified `handleSubmit` to only include the `id` field when it exists (edit mode)
- Prevents undefined id from being passed when creating new categories

### 2. Fixed BudgetCategoriesTab
- Removed the spread operator (`...categoryData`) after setting defaults
- Properly handles `allowRollover` field to avoid boolean coercion issues
- Added filtering of undefined values when updating existing categories

### 3. Enhanced Budget Service
- Added `removeUndefinedValues` utility method to recursively clean objects
- Updated `updateBudget` to filter out undefined values before sending to Firestore
- Prevents any future undefined value errors at the service level

## Result
✅ Budget categories can now be added without errors
✅ Undefined values are filtered out at multiple levels
✅ Better error prevention for all Firestore operations

## Code Changes

### BudgetCategoryModal.tsx
```typescript
// Only include id if it exists (edit mode)
const categoryData: Partial<BudgetCategory> = {
  ...formData,
};

if (category?.id) {
  categoryData.id = category.id;
}
```

### BudgetCategoriesTab.tsx
```typescript
// Removed spread operator that could overwrite with undefined
const newCategory: BudgetCategory = {
  id: `cat-${Date.now()}`,
  name: categoryData.name || 'New Category',
  // ... other fields
  // Removed: ...categoryData
};
```

### budget-service.ts
```typescript
// Added utility to remove undefined values
private removeUndefinedValues(obj: any): any {
  // Recursively removes undefined values from objects
}

// Updated updateBudget to use it
const cleanedBudget = this.removeUndefinedValues(budget);
``` 