# Stripe Test Clocks Guide

Test Clocks cho phép "tua nhanh thời gian" để test subscription renewal, trial expiration, grace period, v.v.

## Yêu cầu

- Stripe CLI đã cài đặt và đăng nhập
- Đang ở chế độ **Test Mode** (không hoạt động với Live Mode)

## 1. Tạo Test Clock

### Qua CLI:

```bash
stripe test_clocks create --frozen-time="2025-12-21T00:00:00Z" --name="Renewal Test"
```

### Qua Dashboard:

1. Vào [Stripe Dashboard](https://dashboard.stripe.com/test/test-clocks)
2. Click **"New test clock"**
3. Đặt tên và chọn thời gian bắt đầu

## 2. Tạo Customer gắn với Test Clock

```bash
# Lấy Test Clock ID (tc_xxxxx)
stripe test_clocks list

# Tạo customer gắn với test clock
stripe customers create \
  --test-clock=tc_xxxxx \
  --email="test@example.com" \
  --name="Test User"
```

## 3. Tạo Subscription cho Customer

```bash
# Tạo payment method
stripe payment_methods attach pm_card_visa --customer=cus_xxxxx

# Set default payment method
stripe customers update cus_xxxxx \
  --invoice-settings[default-payment-method]=pm_xxxxx

# Tạo subscription
stripe subscriptions create \
  --customer=cus_xxxxx \
  --items[0][price]=price_xxxxx
```

## 4. Advance Time (Tua thời gian)

### Qua CLI:

```bash
# Tua 1 tháng
stripe test_clocks advance tc_xxxxx --frozen-time="2026-01-21T00:00:00Z"
```

### Qua Dashboard:

1. Vào Test Clock đã tạo
2. Click **"Advance time"**
3. Chọn thời gian mới → **"Advance"**

## 5. Quan sát Events

Khi advance time, Stripe sẽ tự động:

- Tạo invoice mới
- Charge payment method
- Gửi webhook events

Đảm bảo Stripe CLI đang listen:

```bash
stripe listen --forward-to http://127.0.0.1:8000/stripe/webhook
```

## Test Scenarios

### Test Auto-Renewal

```bash
# Tạo subscription ngày 21/12
# Advance đến ngày 21/01 (1 tháng sau)
stripe test_clocks advance tc_xxxxx --frozen-time="2026-01-21T00:00:00Z"
# → Stripe tạo invoice + charge + gửi webhook
```

### Test Grace Period Expiration

```bash
# Cancel subscription (grace period bắt đầu)
stripe subscriptions cancel sub_xxxxx --prorate=false

# Advance đến sau ends_at
stripe test_clocks advance tc_xxxxx --frozen-time="2026-01-22T00:00:00Z"
# → Subscription chuyển sang expired
```

### Test Payment Failed

```bash
# Attach card sẽ bị decline
stripe payment_methods attach pm_card_chargeDeclined --customer=cus_xxxxx
stripe customers update cus_xxxxx \
  --invoice-settings[default-payment-method]=pm_xxxxx

# Advance time để trigger renewal
stripe test_clocks advance tc_xxxxx --frozen-time="2026-01-21T00:00:00Z"
# → Payment fail, Stripe retry, gửi webhook invoice.payment_failed
```

## Xóa Test Clock

```bash
stripe test_clocks delete tc_xxxxx
```

> **Lưu ý:** Xóa test clock sẽ xóa tất cả customers, subscriptions liên quan.

## Tham khảo

- [Stripe Test Clocks Documentation](https://stripe.com/docs/billing/testing/test-clocks)
- [Test Card Numbers](https://stripe.com/docs/testing#cards)
