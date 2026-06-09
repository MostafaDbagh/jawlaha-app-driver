// English strings for the Jawlah Driver app.
export const en: Record<string, string> = {
  // generic
  no_data: 'No data',
  currency_syp: 'SYP',
  retry: 'Retry',
  cancel: 'Cancel',
  confirm: 'Confirm',
  continue_label: 'Continue',

  // validators
  field_required: 'This field is required',
  plz_enter_valid_number: 'Please enter a valid number',
  plz_enter_valid_phone_number: 'Please enter a valid phone number',
  plz_enter_valid_email: 'Please enter a valid email',
  plz_enter_valid_password: 'Please enter a valid password',
  phone_no_leading_zero: 'Enter the number without the leading 0',
  phone_invalid_length: 'Enter a 9-digit number starting with 9',
  validation_password_strong: 'Password is too weak',
  password_not_match: 'Passwords do not match',
  password_good: 'Good',
  password_strong: 'Strong',
  password_acceptable_strong: 'Too short',

  // auth
  driver_app_name: 'Jawlah Driver',
  welcome_driver: 'Welcome, driver',
  login_phone_dsc: 'Enter your phone number to receive a verification code',
  phone_number: 'Phone number',
  verification_code: 'Verification code',
  verify_phone_dsc: 'Enter the 6-digit code sent to',
  resend_code: 'Resend code',
  dev_use_code: 'Dev: use code @code',
  not_a_driver_account: 'This account is not registered as a driver',

  // tabs
  jobs: 'Jobs',
  active: 'Active',
  earnings: 'Earnings',
  account: 'Account',

  // availability
  online: 'Online',
  offline: 'Offline',
  you_are_online: "You're online — new orders will appear here",
  you_are_offline: "You're offline — go online to receive orders",
  go_online_to_receive: 'Go online to start receiving orders',

  // jobs / orders
  available_orders: 'Available orders',
  no_available_orders: 'No available orders right now',
  active_deliveries: 'Active deliveries',
  no_active_deliveries: 'No active deliveries',
  delivery_history: 'Delivery history',
  no_history: 'No completed deliveries yet',
  accept_order: 'Accept order',
  // exclusive offers
  new_offer: 'New delivery offer',
  offer_respond_hint: 'Respond before the timer ends',
  accept: 'Accept',
  decline: 'Decline',
  offer_declined: 'Offer declined',
  offer_expired: 'Offer expired',
  offer_no_longer_available: 'This offer is no longer available',
  time_left: 'Time left',
  seconds_unit: 's',
  pickup_from: 'Pick up from',
  deliver_to: 'Deliver to',
  customer: 'Customer',
  call_customer: 'Call customer',
  navigate: 'Directions',
  order_total: 'Order total',
  items_count: '@count items',
  one_item: '1 item',
  view_details: 'View details',

  // status
  status_ready: 'Ready for pickup',
  status_on_the_way: 'On the way',
  status_delivered: 'Delivered',
  status_cancelled: 'Cancelled',
  mark_picked_up: 'Mark as picked up',
  mark_delivered: 'Mark as delivered',
  order_accepted: 'Order accepted',
  delivery_completed: 'Delivery completed',

  // delivery detail
  order_number: 'Order',
  delivery_fee: 'Delivery fee',
  subtotal: 'Subtotal',
  your_earning: 'Your earning',
  delivery_note: 'Note',

  // earnings
  todays_earnings: "Today's earnings",
  total_earnings: 'Total earnings',
  todays_deliveries: "Today's deliveries",
  total_deliveries: 'Total deliveries',
  earnings_note: 'You keep the delivery fee on every completed order.',

  // profile
  profile: 'Profile',
  vehicle: 'Vehicle',
  rating: 'Rating',
  status_label: 'Status',
  language: 'Language',
  logout: 'Log out',
  logout_confirm: 'Are you sure you want to log out?',
};
