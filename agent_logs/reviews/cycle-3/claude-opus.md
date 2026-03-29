Both DawShell and InstrumentPanel now use `selectedTrackIds[0]` consistently. The selector in InstrumentPanel returns the full track object (referential equality means it re-renders when any track field changes, not just selection), but that's fine -- InstrumentPanel already needs track data to render the correct sub-panel. Test covers the multi-select divergence regression.

REVIEW_APPROVED
