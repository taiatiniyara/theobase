import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const organization = sqliteTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["general_conference", "division", "union", "conference"],
  }).notNull(),
  parentId: text("parent_id"),
  createdAt: text("created_at").notNull(),
});

export const congregation = sqliteTable("congregation", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["local_church", "company", "branch"] }).notNull(),
  parentId: text("parent_id"),
  parentType: text("parent_type", { enum: ["congregation", "organization"] }),
  organizationId: text("organization_id").references(() => organization.id),
  timezone: text("timezone").notNull().default("UTC"),
  inviteCode: text("invite_code").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const person = sqliteTable("person", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  isMember: integer("is_member", { mode: "boolean" }).default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  personId: text("person_id").references(() => person.id),
  congregationId: text("congregation_id").references(() => congregation.id),
  createdAt: text("created_at").notNull(),
});

export const authToken = sqliteTable("auth_token", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  twoFactorCode: text("two_factor_code"),
  twoFactorExpiresAt: text("two_factor_expires_at"),
  createdAt: text("created_at").notNull(),
});

export const role = sqliteTable("role", {
  id: text("id").primaryKey(),
  personId: text("person_id").references(() => person.id),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  roleType: text("role_type", {
    enum: [
      "clerk",
      "treasurer",
      "elder",
      "deacon",
      "deaconess",
      "head_deacon",
      "head_deaconess",
      "district_pastor",
      "member",
      "pathfinder_director",
      "adventurer_director",
      "dorcas_coordinator",
      "health_ministries_leader",
      "sabbath_school_superintendent",
      "av_operator",
      "youth_leader",
      "music_coordinator",
    ],
  }).notNull(),
  createdAt: text("created_at").notNull(),
});

export const department = sqliteTable("department", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  name: text("name").notNull(),
  type: text("type", {
    enum: [
      "pathfinders",
      "adventurers",
      "sabbath_school",
      "dorcas",
      "health",
      "av",
      "other",
    ],
  }).notNull(),
  createdAt: text("created_at").notNull(),
});

export const receipt = sqliteTable("receipt", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  memberId: text("member_id")
    .references(() => person.id)
    .notNull(),
  amount: integer("amount").notNull(),
  fundSplit: text("fund_split", { mode: "json" })
    .$type<Record<string, number>>()
    .notNull(),
  imageKey: text("image_key"),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  verifiedById: text("verified_by_id").references(() => person.id),
  verifiedAt: text("verified_at"),
  rejectionNote: text("rejection_note"),
  createdAt: text("created_at").notNull(),
});

export const boardMeeting = sqliteTable("board_meeting", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  date: text("date").notNull(),
  agenda: text("agenda"),
  status: text("status", { enum: ["draft", "in_progress", "completed"] })
    .notNull()
    .default("draft"),
  createdAt: text("created_at").notNull(),
});

export const boardMinute = sqliteTable("board_minute", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id")
    .references(() => boardMeeting.id)
    .notNull(),
  content: text("content").notNull(),
  revisionNumber: integer("revision_number").notNull().default(1),
  authorId: text("author_id")
    .references(() => person.id)
    .notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const boardDecision = sqliteTable("board_decision", {
  id: text("id").primaryKey(),
  meetingId: text("meeting_id")
    .references(() => boardMeeting.id)
    .notNull(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  moverId: text("mover_id").references(() => person.id),
  seconderId: text("seconder_id").references(() => person.id),
  voteOutcome: text("vote_outcome", {
    enum: ["approved", "rejected", "tabled"],
  }),
  createdAt: text("created_at").notNull(),
});

export const dutySlot = sqliteTable("duty_slot", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  date: text("date").notNull(),
  role: text("role", {
    enum: [
      "elder",
      "preacher",
      "deacon",
      "deaconess",
      "musician",
      "av_operator",
      "youth_leader",
    ],
  }).notNull(),
  volunteerId: text("volunteer_id").references(() => person.id),
  status: text("status", {
    enum: ["open", "assigned", "declined", "confirmed"],
  })
    .notNull()
    .default("open"),
  createdAt: text("created_at").notNull(),
});

export const safetyClearance = sqliteTable("safety_clearance", {
  id: text("id").primaryKey(),
  volunteerId: text("volunteer_id")
    .references(() => person.id)
    .notNull(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  type: text("type", {
    enum: ["safety_clearance", "child_protection"],
  }).notNull(),
  issuedDate: text("issued_date").notNull(),
  expiryDate: text("expiry_date").notNull(),
  certificateKey: text("certificate_key"),
  createdAt: text("created_at").notNull(),
});

export const expense = sqliteTable("expense", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  amount: integer("amount").notNull(),
  description: text("description").notNull(),
  category: text("category", {
    enum: [
      "church_budget",
      "pathfinders",
      "sabbath_school",
      "adra",
      "local_church",
      "dorcas",
      "health",
      "other",
    ],
  }).notNull(),
  receiptId: text("receipt_id").references(() => receipt.id),
  boardDecisionId: text("board_decision_id").references(() => boardDecision.id),
  createdAt: text("created_at").notNull(),
});

export const pathfinderProgress = sqliteTable("pathfinder_progress", {
  id: text("id").primaryKey(),
  memberId: text("member_id")
    .references(() => person.id)
    .notNull(),
  className: text("class_name", {
    enum: [
      "friend",
      "companion",
      "explorer",
      "ranger",
      "guide",
      "little_lamb",
      "eager_beaver",
      "busy_bee",
      "sunbeam",
      "builder",
      "helping_hand",
    ],
  }).notNull(),
  clubType: text("club_type", {
    enum: ["pathfinders", "adventurers"],
  }).notNull(),
  status: text("status", { enum: ["in_progress", "completed"] })
    .notNull()
    .default("in_progress"),
  completedAt: text("completed_at"),
  createdAt: text("created_at").notNull(),
});

export const pathfinderHonor = sqliteTable("pathfinder_honor", {
  id: text("id").primaryKey(),
  memberId: text("member_id")
    .references(() => person.id)
    .notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  earnedAt: text("earned_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const sabbathSchoolClass = sqliteTable("sabbath_school_class", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  division: text("division", {
    enum: [
      "beginners",
      "kindergarten",
      "primary",
      "juniors",
      "earliteen",
      "youth",
      "adult",
    ],
  }).notNull(),
  name: text("name").notNull(),
  teacherId: text("teacher_id").references(() => person.id),
  createdAt: text("created_at").notNull(),
});

export const sabbathSchoolAttendance = sqliteTable(
  "sabbath_school_attendance",
  {
    id: text("id").primaryKey(),
    classId: text("class_id")
      .references(() => sabbathSchoolClass.id)
      .notNull(),
    date: text("date").notNull(),
    memberId: text("member_id")
      .references(() => person.id)
      .notNull(),
    present: integer("present", { mode: "boolean" }).notNull(),
    notes: text("notes"),
    createdAt: text("created_at").notNull(),
  }
);

export const welfareCase = sqliteTable("welfare_case", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  personId: text("person_id").references(() => person.id),
  assistanceType: text("assistance_type", {
    enum: ["food", "financial", "clothing", "medical", "other"],
  }).notNull(),
  description: text("description").notNull(),
  value: integer("value"),
  createdAt: text("created_at").notNull(),
});

export const pantryItem = sqliteTable("pantry_item", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(),
  updatedAt: text("updated_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const healthEvent = sqliteTable("health_event", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  name: text("name").notNull(),
  date: text("date").notNull(),
  type: text("type", {
    enum: ["health_expo", "cooking_school", "seminar", "screening"],
  }).notNull(),
  createdAt: text("created_at").notNull(),
});

export const healthContact = sqliteTable("health_contact", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .references(() => healthEvent.id)
    .notNull(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  interests: text("interests"),
  followUpStatus: text("follow_up_status", {
    enum: ["new", "contacted", "scheduled", "completed"],
  })
    .notNull()
    .default("new"),
  createdAt: text("created_at").notNull(),
});

export const household = sqliteTable("household", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});

export const householdMember = sqliteTable("household_member", {
  id: text("id").primaryKey(),
  householdId: text("household_id")
    .references(() => household.id)
    .notNull(),
  personId: text("person_id")
    .references(() => person.id)
    .notNull(),
  relationship: text("relationship", {
    enum: ["head", "spouse", "child", "dependant"],
  }).notNull(),
  createdAt: text("created_at").notNull(),
});

export const candidacy = sqliteTable("candidacy", {
  id: text("id").primaryKey(),
  personId: text("person_id")
    .references(() => person.id)
    .notNull(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  stage: text("stage", {
    enum: ["interest", "bible_study", "baptismal_class", "decision"],
  }).notNull(),
  startDate: text("start_date").notNull(),
  decisionDate: text("decision_date"),
  decisionType: text("decision_type", {
    enum: ["baptism", "profession_of_faith", "rebaptism"],
  }),
  officiatingPastorId: text("officiating_pastor_id").references(
    () => person.id
  ),
  createdAt: text("created_at").notNull(),
});

export const communionService = sqliteTable("communion_service", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  date: text("date").notNull(),
  status: text("status", { enum: ["planned", "in_progress", "completed"] })
    .notNull()
    .default("planned"),
  createdAt: text("created_at").notNull(),
});

export const communionRoom = sqliteTable("communion_room", {
  id: text("id").primaryKey(),
  serviceId: text("service_id")
    .references(() => communionService.id)
    .notNull(),
  name: text("name").notNull(),
  gender: text("gender", { enum: ["male", "female", "both"] }).notNull(),
  volunteerIds: text("volunteer_ids"),
});

export const communionInventory = sqliteTable("communion_inventory", {
  id: text("id").primaryKey(),
  serviceId: text("service_id")
    .references(() => communionService.id)
    .notNull(),
  item: text("item", { enum: ["towel", "basin", "bread", "wine"] }).notNull(),
  quantity: integer("quantity").notNull(),
  unit: text("unit").notNull(),
});

export const avOrderOfService = sqliteTable("av_order_of_service", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  date: text("date").notNull(),
  items: text("items").notNull(),
  updatedAt: text("updated_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const district = sqliteTable("district", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  organizationId: text("organization_id").references(() => organization.id),
  createdAt: text("created_at").notNull(),
});

export const districtCongregation = sqliteTable("district_congregation", {
  id: text("id").primaryKey(),
  districtId: text("district_id")
    .references(() => district.id)
    .notNull(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
});

export const preachingRotation = sqliteTable("preaching_rotation", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  date: text("date").notNull(),
  preacherId: text("preacher_id")
    .references(() => person.id)
    .notNull(),
  topic: text("topic"),
  createdAt: text("created_at").notNull(),
});

export const pastoralVisit = sqliteTable("pastoral_visit", {
  id: text("id").primaryKey(),
  householdId: text("household_id").references(() => household.id),
  pastorId: text("pastor_id")
    .references(() => person.id)
    .notNull(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  date: text("date").notNull(),
  purpose: text("purpose"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const facilityBooking = sqliteTable("facility_booking", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  date: text("date").notNull(),
  timeStart: text("time_start").notNull(),
  timeEnd: text("time_end").notNull(),
  purpose: text("purpose").notNull(),
  requesterId: text("requester_id").references(() => person.id),
  status: text("status", { enum: ["pending", "approved", "rejected"] })
    .notNull()
    .default("pending"),
  createdAt: text("created_at").notNull(),
});

export const congregationAsset = sqliteTable("congregation_asset", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  type: text("type", {
    enum: [
      "generator",
      "water_tank",
      "shelter",
      "first_aid",
      "comms_radio",
      "vehicle",
      "kitchen",
      "medical",
    ],
  }).notNull(),
  description: text("description"),
  status: text("status", { enum: ["operational", "damaged", "offline"] })
    .notNull()
    .default("operational"),
  updatedAt: text("updated_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const transferRequest = sqliteTable("transfer_request", {
  id: text("id").primaryKey(),
  memberId: text("member_id")
    .references(() => person.id)
    .notNull(),
  fromCongregationId: text("from_congregation_id")
    .references(() => congregation.id)
    .notNull(),
  toCongregationId: text("to_congregation_id")
    .references(() => congregation.id)
    .notNull(),
  status: text("status", {
    enum: [
      "requested",
      "approved_by_sending",
      "received_by_destination",
      "completed",
      "rejected",
    ],
  })
    .notNull()
    .default("requested"),
  requestedById: text("requested_by_id").references(() => person.id),
  approvedById: text("approved_by_id").references(() => person.id),
  receivedById: text("received_by_id").references(() => person.id),
  createdAt: text("created_at").notNull(),
});

export const nominatingSession = sqliteTable("nominating_session", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  year: integer("year").notNull(),
  status: text("status", { enum: ["open", "closed"] })
    .notNull()
    .default("open"),
  openedById: text("opened_by_id").references(() => person.id),
  createdAt: text("created_at").notNull(),
});

export const nominatingRole = sqliteTable("nominating_role", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .references(() => nominatingSession.id)
    .notNull(),
  roleType: text("role_type").notNull(),
  status: text("status", {
    enum: ["open", "nominated", "invited", "accepted", "declined", "confirmed"],
  })
    .notNull()
    .default("open"),
  createdAt: text("created_at").notNull(),
});

export const nominatingCandidate = sqliteTable("nominating_candidate", {
  id: text("id").primaryKey(),
  roleId: text("role_id")
    .references(() => nominatingRole.id)
    .notNull(),
  personId: text("person_id")
    .references(() => person.id)
    .notNull(),
  nominatedById: text("nominated_by_id").references(() => person.id),
  status: text("status", {
    enum: ["nominated", "invited", "accepted", "declined"],
  })
    .notNull()
    .default("nominated"),
  createdAt: text("created_at").notNull(),
});

export const nominatingBallot = sqliteTable("nominating_ballot", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .references(() => nominatingSession.id)
    .notNull(),
  roleId: text("role_id")
    .references(() => nominatingRole.id)
    .notNull(),
  candidateId: text("candidate_id").references(() => nominatingCandidate.id),
  voterId: text("voter_id")
    .references(() => person.id)
    .notNull(),
  encryptedVote: text("encrypted_vote").notNull(),
  createdAt: text("created_at").notNull(),
});

export const bankAccount = sqliteTable("bank_account", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  bankName: text("bank_name").notNull(),
  accountName: text("account_name").notNull(),
  accountNumber: text("account_number").notNull(),
  createdAt: text("created_at").notNull(),
});

export const subscriptionPlan = sqliteTable("subscription_plan", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  stripePriceId: text("stripe_price_id").notNull().unique(),
  stripeProductId: text("stripe_product_id").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("usd"),
  interval: text("interval", { enum: ["month", "year"] }).notNull(),
  features: text("features", { mode: "json" }).$type<string[]>(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull(),
});

export const subscription = sqliteTable("subscription", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull()
    .unique(),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  planId: text("plan_id").references(() => subscriptionPlan.id),
  status: text("status", {
    enum: [
      "active",
      "past_due",
      "canceled",
      "incomplete",
      "incomplete_expired",
      "trialing",
      "unpaid",
      "paused",
    ],
  }).notNull(),
  currentPeriodStart: text("current_period_start").notNull(),
  currentPeriodEnd: text("current_period_end").notNull(),
  cancelAtPeriodEnd: integer("cancel_at_period_end", {
    mode: "boolean",
  })
    .notNull()
    .default(false),
  canceledAt: text("canceled_at"),
  trialEnd: text("trial_end"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const disciplineCase = sqliteTable("discipline_case", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  personId: text("person_id")
    .references(() => person.id)
    .notNull(),
  caseType: text("case_type", {
    enum: ["censure", "removal", "reinstatement", "counseling"],
  }).notNull(),
  status: text("status", { enum: ["active", "resolved", "appealed"] })
    .notNull()
    .default("active"),
  description: text("description").notNull(),
  resolution: text("resolution"),
  decidedById: text("decided_by_id").references(() => person.id),
  decidedAt: text("decided_at"),
  boardMeetingId: text("board_meeting_id").references(() => boardMeeting.id),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  congregationId: text("congregation_id")
    .references(() => congregation.id)
    .notNull(),
  actorId: text("actor_id")
    .references(() => person.id)
    .notNull(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id"),
  details: text("details"),
  createdAt: text("created_at").notNull(),
});

export const authTokenTokenIdx = index("auth_token_token_idx").on(
  authToken.token
);
export const authTokenEmailIdx = index("auth_token_email_idx").on(
  authToken.email
);
export const personCongregationIdx = index("person_congregation_idx").on(
  person.congregationId
);
export const personEmailIdx = index("person_email_idx").on(person.email);
export const rolePersonIdx = index("role_person_idx").on(role.personId);
export const roleCongregationIdx = index("role_congregation_idx").on(
  role.congregationId
);
export const receiptCongregationIdx = index("receipt_congregation_idx").on(
  receipt.congregationId
);
export const receiptStatusIdx = index("receipt_status_idx").on(receipt.status);
export const dutySlotCongregationDateIdx = index(
  "duty_slot_congregation_date_idx"
).on(dutySlot.congregationId, dutySlot.date);
export const boardMeetingCongregationIdx = index(
  "board_meeting_congregation_idx"
).on(boardMeeting.congregationId);
export const boardDecisionMeetingIdx = index("board_decision_meeting_idx").on(
  boardDecision.meetingId
);
export const expenseCongregationIdx = index("expense_congregation_idx").on(
  expense.congregationId
);
export const transferFromCongregationIdx = index(
  "transfer_from_congregation_idx"
).on(transferRequest.fromCongregationId);
export const transferToCongregationIdx = index(
  "transfer_to_congregation_idx"
).on(transferRequest.toCongregationId);
export const candidacyCongregationIdx = index("candidacy_congregation_idx").on(
  candidacy.congregationId
);
export const disciplineCaseCongregationIdx = index(
  "discipline_case_congregation_idx"
).on(disciplineCase.congregationId);
export const auditLogCongregationIdx = index("audit_log_congregation_idx").on(
  auditLog.congregationId
);
export const auditLogActorIdx = index("audit_log_actor_idx").on(
  auditLog.actorId
);
export const subscriptionCongregationIdx = index(
  "subscription_congregation_idx"
).on(subscription.congregationId);
export const subscriptionStripeIdx = index("subscription_stripe_idx").on(
  subscription.stripeSubscriptionId
);

export const webhookEvent = sqliteTable("webhook_event", {
  id: text("id").primaryKey(),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  processedAt: text("processed_at").notNull(),
});
