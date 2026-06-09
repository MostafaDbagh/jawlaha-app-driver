// Arabic strings for the Jawlah Driver app.
export const ar: Record<string, string> = {
  // generic
  no_data: 'لا توجد بيانات',
  currency_syp: 'ل.س',
  retry: 'إعادة المحاولة',
  cancel: 'إلغاء',
  confirm: 'تأكيد',
  continue_label: 'متابعة',

  // validators
  field_required: 'هذا الحقل مطلوب',
  plz_enter_valid_number: 'الرجاء إدخال رقم صحيح',
  plz_enter_valid_phone_number: 'الرجاء إدخال رقم هاتف صحيح',
  plz_enter_valid_email: 'الرجاء إدخال بريد إلكتروني صحيح',
  plz_enter_valid_password: 'الرجاء إدخال كلمة مرور صحيحة',
  phone_no_leading_zero: 'أدخل الرقم بدون الصفر في البداية',
  phone_invalid_length: 'أدخل رقماً من 9 خانات يبدأ بـ 9',
  validation_password_strong: 'كلمة المرور ضعيفة',
  password_not_match: 'كلمتا المرور غير متطابقتين',
  password_good: 'جيدة',
  password_strong: 'قوية',
  password_acceptable_strong: 'قصيرة جداً',

  // auth
  driver_app_name: 'جولة سائق',
  welcome_driver: 'أهلاً بك أيها السائق',
  login_phone_dsc: 'أدخل رقم هاتفك لاستلام رمز التحقق',
  phone_number: 'رقم الهاتف',
  verification_code: 'رمز التحقق',
  verify_phone_dsc: 'أدخل الرمز المكوّن من 6 أرقام المرسل إلى',
  resend_code: 'إعادة إرسال الرمز',
  dev_use_code: 'تطوير: استخدم الرمز @code',
  not_a_driver_account: 'هذا الحساب غير مسجّل كسائق',

  // tabs
  jobs: 'الطلبات',
  active: 'الجارية',
  earnings: 'الأرباح',
  account: 'الحساب',

  // availability
  online: 'متصل',
  offline: 'غير متصل',
  you_are_online: 'أنت متصل — ستظهر الطلبات الجديدة هنا',
  you_are_offline: 'أنت غير متصل — اتصل لاستلام الطلبات',
  go_online_to_receive: 'اتصل لبدء استلام الطلبات',

  // jobs / orders
  available_orders: 'الطلبات المتاحة',
  no_available_orders: 'لا توجد طلبات متاحة حالياً',
  active_deliveries: 'التوصيلات الجارية',
  no_active_deliveries: 'لا توجد توصيلات جارية',
  delivery_history: 'سجل التوصيلات',
  no_history: 'لا توجد توصيلات مكتملة بعد',
  accept_order: 'قبول الطلب',
  // exclusive offers
  new_offer: 'طلب توصيل جديد',
  offer_respond_hint: 'يرجى الرد قبل انتهاء الوقت',
  accept: 'قبول',
  decline: 'رفض',
  offer_declined: 'تم رفض العرض',
  offer_expired: 'انتهى وقت العرض',
  offer_no_longer_available: 'لم يعد هذا العرض متاحاً',
  time_left: 'الوقت المتبقي',
  seconds_unit: 'ث',
  pickup_from: 'الاستلام من',
  deliver_to: 'التوصيل إلى',
  customer: 'الزبون',
  call_customer: 'اتصال بالزبون',
  navigate: 'الاتجاهات على الخريطة',
  order_total: 'إجمالي الطلب',
  items_count: '@count عناصر',
  one_item: 'عنصر واحد',
  view_details: 'عرض التفاصيل',

  // status
  status_ready: 'جاهز للاستلام',
  status_on_the_way: 'في الطريق',
  status_delivered: 'تم التوصيل',
  status_cancelled: 'ملغى',
  mark_picked_up: 'تم الاستلام',
  mark_delivered: 'تم التوصيل',
  order_accepted: 'تم قبول الطلب',
  delivery_completed: 'تم إكمال التوصيل',

  // delivery detail
  order_number: 'الطلب',
  delivery_fee: 'رسوم التوصيل',
  subtotal: 'المجموع الفرعي',
  your_earning: 'ربحك',
  delivery_note: 'ملاحظة',

  // earnings
  todays_earnings: 'أرباح اليوم',
  total_earnings: 'إجمالي الأرباح',
  todays_deliveries: 'توصيلات اليوم',
  total_deliveries: 'إجمالي التوصيلات',
  earnings_note: 'تحتفظ برسوم التوصيل عن كل طلب مكتمل.',

  // profile
  profile: 'الملف الشخصي',
  vehicle: 'المركبة',
  rating: 'التقييم',
  status_label: 'الحالة',
  language: 'اللغة',
  logout: 'تسجيل الخروج',
  logout_confirm: 'هل أنت متأكد من تسجيل الخروج؟',
};
