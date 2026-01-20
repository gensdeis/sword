# Testing Checklist

## Setup Testing
- [ ] Dependencies install correctly (`npm install`)
- [ ] Development server starts (`npm run dev`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Environment variables load correctly

## Authentication
- [ ] Register new user
  - [ ] Form validation works
  - [ ] Successful registration redirects to dashboard
  - [ ] Token is stored in localStorage
  - [ ] Error messages display for invalid input
- [ ] Login existing user
  - [ ] Form validation works
  - [ ] Successful login redirects to dashboard
  - [ ] Token is stored in localStorage
  - [ ] Error messages display for invalid credentials
- [ ] Logout
  - [ ] Logout button works
  - [ ] Token is removed from localStorage
  - [ ] Redirects to login page
- [ ] Protected routes
  - [ ] Unauthenticated users redirect to login
  - [ ] 401 errors trigger logout and redirect

## Dashboard
- [ ] Quick stats display correctly
  - [ ] Gold amount
  - [ ] Stones amount
  - [ ] Weapons count
- [ ] Attendance check button works
- [ ] Current equipped weapon shows
- [ ] Quick action cards link to correct pages

## Header
- [ ] Navigation links work
- [ ] Gold/stones display updates in real-time
- [ ] Attendance button works
- [ ] Logout button works
- [ ] Mobile navigation displays correctly

## Weapons Page
- [ ] Weapons load and display correctly
- [ ] Rarity filter works
  - [ ] All
  - [ ] Common
  - [ ] Rare
  - [ ] Epic
  - [ ] Legendary
- [ ] Sort functionality works
  - [ ] By enhancement level
  - [ ] By rarity
- [ ] Weapon card displays correctly
  - [ ] Image or placeholder
  - [ ] Name with rarity color
  - [ ] Enhancement level
  - [ ] Attack power calculation
  - [ ] Equipped badge
- [ ] Equip button works
  - [ ] Only one weapon equipped at a time
  - [ ] Success toast displays
- [ ] Sell button works
  - [ ] Confirmation dialog shows
  - [ ] Cannot sell equipped weapon
  - [ ] Gold updates after selling
  - [ ] Success toast displays

## Gacha Page
- [ ] Gold display shows current amount
- [ ] Pull button
  - [ ] Disabled when insufficient gold
  - [ ] Deducts 1000 gold
  - [ ] Shows pulled weapon
- [ ] Weapon result displays correctly
  - [ ] Weapon image
  - [ ] Name with rarity color
  - [ ] Stats
  - [ ] Reroll count
  - [ ] Reroll cost
- [ ] Reroll button
  - [ ] Disabled when insufficient gold
  - [ ] Cost increases correctly
  - [ ] Shows new weapon
- [ ] Keep button
  - [ ] Adds weapon to inventory
  - [ ] Resets gacha state
  - [ ] Success toast displays

## Battle Page
- [ ] Gold display shows current amount
- [ ] Enter battle button
  - [ ] Disabled when insufficient gold (100)
  - [ ] Deducts 100 gold
  - [ ] Shows opponent info
- [ ] Opponent card displays
  - [ ] Username
  - [ ] Weapon rarity
  - [ ] Weapon level
- [ ] Battle button works
  - [ ] Shows result modal
  - [ ] Displays battle details
  - [ ] Shows rewards on victory
- [ ] Battle result modal
  - [ ] Victory/defeat indicator
  - [ ] Player stats
  - [ ] Opponent stats
  - [ ] Battle power comparison
  - [ ] Rewards (on victory)
  - [ ] Win streak count

## Ranking Page
- [ ] Season info displays
  - [ ] Season name
  - [ ] Start/end dates
  - [ ] Active status
- [ ] Personal rank displays
  - [ ] Rank number/icon
  - [ ] Username
  - [ ] Total victories
  - [ ] Win streak
- [ ] Top 100 leaderboard
  - [ ] Rankings display correctly
  - [ ] Medal icons for top 3
  - [ ] Personal rank highlighted
  - [ ] Stats show correctly

## Mail Page
- [ ] Unread count badge shows
- [ ] Mail list displays
  - [ ] Title
  - [ ] Content
  - [ ] Unread indicator
  - [ ] Timestamp
  - [ ] Expiration (if any)
- [ ] Rewards display
  - [ ] Gold amount
  - [ ] Stones amount
- [ ] Claim button
  - [ ] Only shows for unclaimed mails
  - [ ] Updates gold/stones
  - [ ] Changes to "claimed" state
  - [ ] Success toast displays
- [ ] Delete button
  - [ ] Confirmation dialog shows
  - [ ] Removes mail from list
  - [ ] Success toast displays

## UI/UX
- [ ] Toast notifications work
  - [ ] Success messages (green)
  - [ ] Error messages (red)
  - [ ] Info messages
- [ ] Loading states display
  - [ ] Spinner shows during API calls
  - [ ] Buttons show loading state
- [ ] Responsive design
  - [ ] Mobile view (< 768px)
  - [ ] Tablet view (768px - 1024px)
  - [ ] Desktop view (> 1024px)
  - [ ] Navigation adapts to screen size
- [ ] Colors and styling
  - [ ] Rarity colors correct
    - [ ] Common (gray)
    - [ ] Rare (blue)
    - [ ] Epic (purple)
    - [ ] Legendary (orange)
  - [ ] Consistent spacing
  - [ ] Readable fonts

## Error Handling
- [ ] Network errors show toast
- [ ] 401 errors trigger logout
- [ ] 400 errors show error message
- [ ] 404 errors handled gracefully
- [ ] Server errors (500) show generic message
- [ ] No internet connection handled

## Performance
- [ ] Pages load quickly
- [ ] No unnecessary re-renders
- [ ] Images load efficiently
- [ ] API calls optimized
- [ ] State updates don't cause lag

## Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers

## Accessibility
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Form labels present
- [ ] Buttons have meaningful text
- [ ] Error messages are clear

## Integration with Backend
- [ ] All API endpoints respond correctly
- [ ] JWT authentication works
- [ ] Data syncs properly
- [ ] Real-time updates work
- [ ] Error responses handled

## Edge Cases
- [ ] Empty states display correctly
  - [ ] No weapons
  - [ ] No mails
  - [ ] No battle history
- [ ] Very long usernames
- [ ] Very large numbers (gold/stones)
- [ ] Network latency
- [ ] Rapid button clicks
- [ ] Browser refresh maintains state
- [ ] Expired JWT token

## Security
- [ ] Passwords not visible in form
- [ ] JWT token not exposed
- [ ] No sensitive data in console
- [ ] XSS protection
- [ ] CSRF protection

## Notes
- Test on both development and production builds
- Clear localStorage between tests when needed
- Use different test accounts
- Test with various data scenarios
- Document any bugs found
