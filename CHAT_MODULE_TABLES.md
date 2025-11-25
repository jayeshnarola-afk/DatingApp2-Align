# 📊 Chat Module - Tables Summary

## Chat Module Se Related **4 Main Tables** Hain:

---

## ✅ **1. `conversations` Table**

**Entity:** `conversation.entities.ts`  
**Migration:** `1740137176905-create_conversations.ts`

### Columns:
- `id` (int, Primary Key, Auto Increment)
- `type` (enum: "one-to-one" | "group")
- `created_at` (timestamp)

### Purpose:
- Chat conversations store karta hai
- One-to-one ya group chat types support karta hai

---

## ✅ **2. `conversations_participant` Table**

**Entity:** `conversation.participant.entities.ts`  
**Migration:** `1740137686346-create_conversations_participant.ts`

### Columns:
- `id` (int, Primary Key, Auto Increment)
- `conversation_id` (int, Foreign Key → conversations.id)
- `user_id` (int, Foreign Key → user.id)
- `role` (enum: "member" | "admin")
- `last_cleared_message_id` (int, nullable)
- `last_read_message_id` (int, nullable)
- `is_notification_mute` (boolean, default: false)
- `is_unmatched_user` (boolean, default: false)
- `created_at` (timestamp)

### Purpose:
- Conversation mein participants track karta hai
- Read receipts ke liye (last_read_message_id)
- Notification mute status
- Unmatch status track karta hai

---

## ✅ **3. `message` Table**

**Entity:** `message.entity.ts`  
**Migration:** `1740138348605-create_message_table.ts`

### Columns:
- `id` (int, Primary Key, Auto Increment)
- `message_id` (bigint, nullable)
- `conversation_id` (int, Foreign Key → conversations.id)
- `sender_id` (int, Foreign Key → user.id)
- `content` (text, nullable)
- `message_type` (enum: "text" | "image" | "video" | "audio" | "document")
- `images` (jsonb, nullable)
- `media_url` (varchar, nullable)
- `status` (enum: "sent" | "delivered" | "read")
- `is_location_active` (boolean, default: true)
- `schedule_time` (timestamp, nullable)
- `meeting_status` (varchar, nullable)
- `is_deleted_by_admin` (boolean, default: false)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `deleted_at` (timestamp, nullable)

### Purpose:
- Messages store karta hai
- Text, images, videos, files, location messages support karta hai
- Message status (sent, delivered, read) track karta hai

---

## ✅ **4. `message_meetings` Table** (Optional - Location/Dating Feature)

**Entity:** `message_meetings.entities.ts`  
**Migration:** `1752656624900-create_dating_message_table.ts`

### Columns:
- `id` (int, Primary Key, Auto Increment)
- `message_id` (int, Foreign Key → message.id)
- `dating_creator` (int, nullable, Foreign Key → user.id)
- `dating_partner` (int, nullable, Foreign Key → user.id)
- `name` (varchar 255)
- `address` (text)
- `latitude` (decimal)
- `longitude` (decimal)
- `distance_km` (varchar, nullable)
- `meeting_status` (varchar: "pending" | "confirmed" | "rescheduled" | "canceled" | "rejected" | "expired" | "completed")
- `canceled_reason` (varchar, nullable)
- `schedule_time` (timestamp, nullable)
- `image_url` (varchar, nullable)
- `rating` (float, nullable)
- `place_id` (varchar, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### Purpose:
- Location/dating messages ke details store karta hai
- Cafe/location sharing feature ke liye
- Meeting scheduling ke liye
- Distance calculation ke liye

---

## 📋 **Tables Summary:**

| # | Table Name | Purpose | Required |
|---|------------|---------|----------|
| 1 | `conversations` | Chat conversations store | ✅ **Required** |
| 2 | `conversations_participant` | Participants & read receipts | ✅ **Required** (agar read receipts chahiye) |
| 3 | `message` | Messages store | ✅ **Required** |
| 4 | `message_meetings` | Location/dating messages | ⚠️ **Optional** (agar location feature chahiye) |

---

## 🔗 **Table Relationships:**

```
conversations (1) ────< (many) conversations_participant
conversations (1) ────< (many) message
message (1) ────< (1) message_meetings (optional)
user (1) ────< (many) conversations_participant
user (1) ────< (many) message (as sender)
```

---

## 🎯 **Minimum Tables for Basic Chat:**

Agar sirf **basic chat** chahiye (read receipts ke bina), to:
- ✅ `conversations` - Required
- ✅ `message` - Required

**Total: 2 Tables** (Minimum)

---

## 🎯 **Full Featured Chat:**

Agar **complete chat** chahiye (read receipts, notifications, location sharing), to:
- ✅ `conversations` - Required
- ✅ `conversations_participant` - Required (read receipts ke liye)
- ✅ `message` - Required
- ✅ `message_meetings` - Optional (location feature ke liye)

**Total: 3-4 Tables** (Full Featured)

---

## 📝 **Quick Reference:**

### **Core Tables (Required):**
1. `conversations` - Chat conversations
2. `message` - Messages

### **Advanced Tables (Optional):**
3. `conversations_participant` - Read receipts, notifications
4. `message_meetings` - Location/dating feature

---

**Summary: Chat module mein total 4 tables hain, lekin basic chat ke liye sirf 2 tables (conversations + message) kaafi hain!**


