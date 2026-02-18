# Monetization A/B Paywall Architecture

This app now uses a placement-based paywall routing model inspired by Superwall patterns:

- Placement trigger from feature surfaces (`settings_upgrade_plan`, `settings_buy_ai_credits`, `settings_buy_scan_credits`, `interview_get_more_credits`).
- Sticky variant assignment per user seed + placement.
- Weighted experiment variants with optional holdout behavior when total traffic allocation is below 100%.
- Surface routing by variant (`subscription`, `ai_credits`, `scan_credits`, or `holdout`).

## Key files

- `app/src/store/monetizationExperimentsStore.ts`
- `app/src/screens/careerLift/components/creditPacksDrawer.tsx`
- `app/src/screens/careerLift/subscriptionModal.tsx`
- `app/src/screens/careerLift/settingsProfile.tsx`
- `app/src/screens/careerLift/interviewPrep.tsx`

## Runtime flow

1. UI calls `evaluatePlacement({ placement, seedKey })`.
2. Store computes deterministic bucket and resolves variant by weights.
3. Variant selects the paywall surface and copy variant.
4. UI opens the corresponding component drawer/modal.

## QA controls

Use the store actions:

- `setPlacementOverride(placement, variantId)` to force a variant.
- `setVariantWeights(placement, weights)` to update traffic allocation.
- `clearAssignments()` to force re-assignment.
- `resetExperiments()` to reset to defaults.

## Notes

- Defaults are set to control variants at 100% to preserve current user behavior.
- A/B behavior is enabled and can be activated by updating variant weights.

## External references

- Superwall docs, placements and registration model:
  - https://superwall.com/docs/android/sdk-reference/register
  - https://superwall.com/docs/ios/sdk-reference/register
- Superwall docs, A/B testing and holdouts:
  - https://superwall.com/docs/android/guides/using-campaigns
  - https://superwall.com/docs/product/campaigns/configuring-variants
  - https://superwall.com/docs/product/campaigns/holdouts
