
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "albums": {
                  Row: {
                    "cover_photo_id": string | null,"created_at": string,"created_by": string,"deleted_at": string | null,"description": string,"id": string,"sort_order": number,"space_id": string,"status": Database["public"]['Enums']["content_status"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cover_photo_id"?: string | null,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"description"?: string,"id"?: string,"sort_order"?: number,"space_id": string,"status"?: Database["public"]['Enums']["content_status"],"title": string,"updated_at"?: string
                  }
                  Update: {
                    "cover_photo_id"?: string | null,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"description"?: string,"id"?: string,"sort_order"?: number,"space_id"?: string,"status"?: Database["public"]['Enums']["content_status"],"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "albums_cover_photo_fk"
      columns: ["cover_photo_id"]
isOneToOne: false
      referencedRelation: "photos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "albums_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"answers": {
                  Row: {
                    "body": string,"created_at": string,"created_by": string,"deleted_at": string | null,"id": string,"question_id": string,"space_id": string,"status": Database["public"]['Enums']["content_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"question_id": string,"space_id": string,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"question_id"?: string,"space_id"?: string,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "answers_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "questions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "answers_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"entity_id": string | null,"entity_table": string,"id": string,"shared": boolean,"space_id": string,"summary": string
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"entity_table": string,"id"?: string,"shared"?: boolean,"space_id": string,"summary"?: string
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"entity_id"?: string | null,"entity_table"?: string,"id"?: string,"shared"?: boolean,"space_id"?: string,"summary"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_logs_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"content_section_drafts": {
                  Row: {
                    "data": NonNullable<Json>,"id": string,"key": string,"space_id": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "data"?: NonNullable<Json>,"id"?: string,"key": string,"space_id": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "data"?: NonNullable<Json>,"id"?: string,"key"?: string,"space_id"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "content_section_drafts_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"content_sections": {
                  Row: {
                    "created_at": string,"data": NonNullable<Json>,"id": string,"key": string,"space_id": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"data"?: NonNullable<Json>,"id"?: string,"key": string,"space_id": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"data"?: NonNullable<Json>,"id"?: string,"key"?: string,"space_id"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "content_sections_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"content_versions": {
                  Row: {
                    "author_id": string | null,"changed_by": string | null,"created_at": string,"entity_id": string,"entity_table": string,"id": string,"snapshot": NonNullable<Json>,"space_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id"?: string | null,"changed_by"?: string | null,"created_at"?: string,"entity_id": string,"entity_table": string,"id"?: string,"snapshot": NonNullable<Json>,"space_id": string
                  }
                  Update: {
                    "author_id"?: string | null,"changed_by"?: string | null,"created_at"?: string,"entity_id"?: string,"entity_table"?: string,"id"?: string,"snapshot"?: NonNullable<Json>,"space_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "content_versions_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"daily_note_schedule": {
                  Row: {
                    "day": string,"note_id": string,"space_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "day": string,"note_id": string,"space_id": string
                  }
                  Update: {
                    "day"?: string,"note_id"?: string,"space_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "daily_note_schedule_note_id_fkey"
      columns: ["note_id"]
isOneToOne: false
      referencedRelation: "daily_notes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "daily_note_schedule_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"daily_notes": {
                  Row: {
                    "body": string,"category": string,"created_at": string,"created_by": string,"deleted_at": string | null,"id": string,"sort_order": number,"space_id": string,"status": Database["public"]['Enums']["content_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"category"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"sort_order"?: number,"space_id": string,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"category"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"sort_order"?: number,"space_id"?: string,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "daily_notes_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"distance_notes": {
                  Row: {
                    "body": string,"created_at": string,"created_by": string,"deleted_at": string | null,"id": string,"kind": string,"space_id": string,"status": Database["public"]['Enums']["content_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"kind"?: string,"space_id": string,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"kind"?: string,"space_id"?: string,"status"?: Database["public"]['Enums']["content_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "distance_notes_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"future_plans": {
                  Row: {
                    "category": string,"completed_on": string | null,"created_at": string,"created_by": string,"deleted_at": string | null,"description": string,"id": string,"memory_id": string | null,"sort_order": number,"space_id": string,"state": string,"target_date": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string,"completed_on"?: string | null,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"description"?: string,"id"?: string,"memory_id"?: string | null,"sort_order"?: number,"space_id": string,"state"?: string,"target_date"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "category"?: string,"completed_on"?: string | null,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"description"?: string,"id"?: string,"memory_id"?: string | null,"sort_order"?: number,"space_id"?: string,"state"?: string,"target_date"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "future_plans_memory_id_fkey"
      columns: ["memory_id"]
isOneToOne: false
      referencedRelation: "memories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "future_plans_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"journal_entries": {
                  Row: {
                    "body": string,"created_at": string,"created_by": string,"deleted_at": string | null,"entry_date": string,"id": string,"space_id": string,"status": Database["public"]['Enums']["content_status"],"tags": (string)[],"title": string,"updated_at": string,"visibility": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"entry_date"?: string,"id"?: string,"space_id": string,"status"?: Database["public"]['Enums']["content_status"],"tags"?: (string)[],"title"?: string,"updated_at"?: string,"visibility"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"entry_date"?: string,"id"?: string,"space_id"?: string,"status"?: Database["public"]['Enums']["content_status"],"tags"?: (string)[],"title"?: string,"updated_at"?: string,"visibility"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "journal_entries_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"journal_entry_photos": {
                  Row: {
                    "entry_id": string,"photo_id": string,"sort_order": number,"space_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "entry_id": string,"photo_id": string,"sort_order"?: number,"space_id": string
                  }
                  Update: {
                    "entry_id"?: string,"photo_id"?: string,"sort_order"?: number,"space_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "journal_entry_photos_entry_id_fkey"
      columns: ["entry_id"]
isOneToOne: false
      referencedRelation: "journal_entries"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "journal_entry_photos_photo_id_fkey"
      columns: ["photo_id"]
isOneToOne: false
      referencedRelation: "photos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "journal_entry_photos_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"letters": {
                  Row: {
                    "body": string,"category": string,"created_at": string,"created_by": string,"deleted_at": string | null,"envelope_style": string,"font_style": string,"id": string,"seal": string,"sort_order": number,"space_id": string,"status": Database["public"]['Enums']["content_status"],"title": string,"unlock_at": string | null,"updated_at": string,"written_on": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string,"category"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"envelope_style"?: string,"font_style"?: string,"id"?: string,"seal"?: string,"sort_order"?: number,"space_id": string,"status"?: Database["public"]['Enums']["content_status"],"title": string,"unlock_at"?: string | null,"updated_at"?: string,"written_on"?: string
                  }
                  Update: {
                    "body"?: string,"category"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"envelope_style"?: string,"font_style"?: string,"id"?: string,"seal"?: string,"sort_order"?: number,"space_id"?: string,"status"?: Database["public"]['Enums']["content_status"],"title"?: string,"unlock_at"?: string | null,"updated_at"?: string,"written_on"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "letters_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"media_assets": {
                  Row: {
                    "bucket": string,"byte_size": number | null,"checksum_sha256": string | null,"created_at": string,"deleted_at": string | null,"duration_ms": number | null,"height": number | null,"id": string,"kind": string,"mime_type": string,"original_filename": string | null,"original_path": string,"placeholder": string | null,"sealed_until": string | null,"space_id": string,"state": string,"uploaded_by": string,"variants": NonNullable<Json>,"visibility": string,"width": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bucket"?: string,"byte_size"?: number | null,"checksum_sha256"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"duration_ms"?: number | null,"height"?: number | null,"id"?: string,"kind": string,"mime_type": string,"original_filename"?: string | null,"original_path": string,"placeholder"?: string | null,"sealed_until"?: string | null,"space_id": string,"state"?: string,"uploaded_by"?: string,"variants"?: NonNullable<Json>,"visibility"?: string,"width"?: number | null
                  }
                  Update: {
                    "bucket"?: string,"byte_size"?: number | null,"checksum_sha256"?: string | null,"created_at"?: string,"deleted_at"?: string | null,"duration_ms"?: number | null,"height"?: number | null,"id"?: string,"kind"?: string,"mime_type"?: string,"original_filename"?: string | null,"original_path"?: string,"placeholder"?: string | null,"sealed_until"?: string | null,"space_id"?: string,"state"?: string,"uploaded_by"?: string,"variants"?: NonNullable<Json>,"visibility"?: string,"width"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "media_assets_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"memories": {
                  Row: {
                    "album_id": string | null,"category": string,"created_at": string,"created_by": string,"date_precision": string,"deleted_at": string | null,"description": string,"happened_on": string | null,"id": string,"relationship_date_key": string | null,"sort_order": number,"space_id": string,"special_note": string,"star_size": number,"star_tone": string,"status": Database["public"]['Enums']["content_status"],"summary": string,"tags": (string)[],"title": string,"updated_at": string,"voice_memory_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "album_id"?: string | null,"category"?: string,"created_at"?: string,"created_by"?: string,"date_precision"?: string,"deleted_at"?: string | null,"description"?: string,"happened_on"?: string | null,"id"?: string,"relationship_date_key"?: string | null,"sort_order"?: number,"space_id": string,"special_note"?: string,"star_size"?: number,"star_tone"?: string,"status"?: Database["public"]['Enums']["content_status"],"summary"?: string,"tags"?: (string)[],"title": string,"updated_at"?: string,"voice_memory_id"?: string | null
                  }
                  Update: {
                    "album_id"?: string | null,"category"?: string,"created_at"?: string,"created_by"?: string,"date_precision"?: string,"deleted_at"?: string | null,"description"?: string,"happened_on"?: string | null,"id"?: string,"relationship_date_key"?: string | null,"sort_order"?: number,"space_id"?: string,"special_note"?: string,"star_size"?: number,"star_tone"?: string,"status"?: Database["public"]['Enums']["content_status"],"summary"?: string,"tags"?: (string)[],"title"?: string,"updated_at"?: string,"voice_memory_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "memories_album_id_fkey"
      columns: ["album_id"]
isOneToOne: false
      referencedRelation: "albums"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memories_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memories_voice_memory_id_fkey"
      columns: ["voice_memory_id"]
isOneToOne: false
      referencedRelation: "voice_memories"
      referencedColumns: ["id"]
    }
                  ]
                },"memory_photos": {
                  Row: {
                    "memory_id": string,"photo_id": string,"sort_order": number,"space_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "memory_id": string,"photo_id": string,"sort_order"?: number,"space_id": string
                  }
                  Update: {
                    "memory_id"?: string,"photo_id"?: string,"sort_order"?: number,"space_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memory_photos_memory_id_fkey"
      columns: ["memory_id"]
isOneToOne: false
      referencedRelation: "memories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memory_photos_photo_id_fkey"
      columns: ["photo_id"]
isOneToOne: false
      referencedRelation: "photos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memory_photos_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"photos": {
                  Row: {
                    "album_id": string | null,"alt_text": string,"asset_id": string,"caption": string,"created_at": string,"created_by": string,"deleted_at": string | null,"display_style": string,"id": string,"is_favorite": boolean,"show_in_gallery": boolean,"sort_order": number,"space_id": string,"status": Database["public"]['Enums']["content_status"],"tags": (string)[],"taken_on": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "album_id"?: string | null,"alt_text"?: string,"asset_id": string,"caption"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"display_style"?: string,"id"?: string,"is_favorite"?: boolean,"show_in_gallery"?: boolean,"sort_order"?: number,"space_id": string,"status"?: Database["public"]['Enums']["content_status"],"tags"?: (string)[],"taken_on"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "album_id"?: string | null,"alt_text"?: string,"asset_id"?: string,"caption"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"display_style"?: string,"id"?: string,"is_favorite"?: boolean,"show_in_gallery"?: boolean,"sort_order"?: number,"space_id"?: string,"status"?: Database["public"]['Enums']["content_status"],"tags"?: (string)[],"taken_on"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "photos_album_id_fkey"
      columns: ["album_id"]
isOneToOne: false
      referencedRelation: "albums"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "photos_asset_id_fkey"
      columns: ["asset_id"]
isOneToOne: false
      referencedRelation: "media_assets"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "photos_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"private_spaces": {
                  Row: {
                    "created_at": string,"created_by": string,"id": string,"name": string,"owner_city": string,"owner_name": string,"owner_timezone": string,"partner_city": string,"partner_full_name": string | null,"partner_name": string,"partner_timezone": string,"reasons_mode": string,"reasons_started_on": string | null,"tagline": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by": string,"id"?: string,"name": string,"owner_city": string,"owner_name": string,"owner_timezone": string,"partner_city": string,"partner_full_name"?: string | null,"partner_name": string,"partner_timezone": string,"reasons_mode"?: string,"reasons_started_on"?: string | null,"tagline"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string,"id"?: string,"name"?: string,"owner_city"?: string,"owner_name"?: string,"owner_timezone"?: string,"partner_city"?: string,"partner_full_name"?: string | null,"partner_name"?: string,"partner_timezone"?: string,"reasons_mode"?: string,"reasons_started_on"?: string | null,"tagline"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "birthday_day": number | null,"birthday_month": number | null,"city": string | null,"created_at": string,"display_name": string,"id": string,"timezone": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "birthday_day"?: number | null,"birthday_month"?: number | null,"city"?: string | null,"created_at"?: string,"display_name": string,"id": string,"timezone"?: string,"updated_at"?: string
                  }
                  Update: {
                    "birthday_day"?: number | null,"birthday_month"?: number | null,"city"?: string | null,"created_at"?: string,"display_name"?: string,"id"?: string,"timezone"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"questions": {
                  Row: {
                    "category": string,"created_at": string,"created_by": string,"deleted_at": string | null,"id": string,"prompt": string,"sort_order": number,"space_id": string,"status": Database["public"]['Enums']["content_status"],"together": boolean,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"prompt": string,"sort_order"?: number,"space_id": string,"status"?: Database["public"]['Enums']["content_status"],"together"?: boolean,"updated_at"?: string
                  }
                  Update: {
                    "category"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"prompt"?: string,"sort_order"?: number,"space_id"?: string,"status"?: Database["public"]['Enums']["content_status"],"together"?: boolean,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "questions_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"relationship_dates": {
                  Row: {
                    "created_at": string,"day": number | null,"happened": boolean,"id": string,"key": string,"kind": string,"label": string,"month": number | null,"note": string,"person": Database["public"]['Enums']["member_role"] | null,"recurs_yearly": boolean,"sort_order": number,"space_id": string,"updated_at": string,"year": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"day"?: number | null,"happened"?: boolean,"id"?: string,"key": string,"kind": string,"label": string,"month"?: number | null,"note"?: string,"person"?: Database["public"]['Enums']["member_role"] | null,"recurs_yearly"?: boolean,"sort_order"?: number,"space_id": string,"updated_at"?: string,"year"?: number | null
                  }
                  Update: {
                    "created_at"?: string,"day"?: number | null,"happened"?: boolean,"id"?: string,"key"?: string,"kind"?: string,"label"?: string,"month"?: number | null,"note"?: string,"person"?: Database["public"]['Enums']["member_role"] | null,"recurs_yearly"?: boolean,"sort_order"?: number,"space_id"?: string,"updated_at"?: string,"year"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "relationship_dates_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"space_invites": {
                  Row: {
                    "accepted_at": string | null,"accepted_by": string | null,"created_at": string,"created_by": string,"display_name": string,"email": string,"expires_at": string,"id": string,"revoked_at": string | null,"space_id": string,"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"created_at"?: string,"created_by"?: string,"display_name"?: string,"email": string,"expires_at": string,"id"?: string,"revoked_at"?: string | null,"space_id": string,"token_hash": string
                  }
                  Update: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"created_at"?: string,"created_by"?: string,"display_name"?: string,"email"?: string,"expires_at"?: string,"id"?: string,"revoked_at"?: string | null,"space_id"?: string,"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "space_invites_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"space_members": {
                  Row: {
                    "joined_at": string,"role": Database["public"]['Enums']["member_role"],"space_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "joined_at"?: string,"role": Database["public"]['Enums']["member_role"],"space_id": string,"user_id": string
                  }
                  Update: {
                    "joined_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"space_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "space_members_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"special_day_editions": {
                  Row: {
                    "album_id": string | null,"cover_photo_id": string | null,"created_at": string,"created_by": string,"deleted_at": string | null,"id": string,"letter_id": string | null,"note": string,"reveal_at": string | null,"space_id": string,"special_day_id": string,"status": Database["public"]['Enums']["content_status"],"title": string,"updated_at": string,"year": number
                  }
                  ComputedFields: never
                  Insert: {
                    "album_id"?: string | null,"cover_photo_id"?: string | null,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"letter_id"?: string | null,"note"?: string,"reveal_at"?: string | null,"space_id": string,"special_day_id": string,"status"?: Database["public"]['Enums']["content_status"],"title"?: string,"updated_at"?: string,"year": number
                  }
                  Update: {
                    "album_id"?: string | null,"cover_photo_id"?: string | null,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"letter_id"?: string | null,"note"?: string,"reveal_at"?: string | null,"space_id"?: string,"special_day_id"?: string,"status"?: Database["public"]['Enums']["content_status"],"title"?: string,"updated_at"?: string,"year"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "special_day_editions_album_id_fkey"
      columns: ["album_id"]
isOneToOne: false
      referencedRelation: "albums"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "special_day_editions_cover_photo_id_fkey"
      columns: ["cover_photo_id"]
isOneToOne: false
      referencedRelation: "photos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "special_day_editions_letter_id_fkey"
      columns: ["letter_id"]
isOneToOne: false
      referencedRelation: "letters"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "special_day_editions_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "special_day_editions_special_day_id_fkey"
      columns: ["special_day_id"]
isOneToOne: false
      referencedRelation: "special_days"
      referencedColumns: ["id"]
    }
                  ]
                },"special_days": {
                  Row: {
                    "cover_photo_id": string | null,"created_at": string,"created_by": string,"deleted_at": string | null,"id": string,"intro": string,"relationship_date_id": string,"show_countdown": boolean,"slug": string,"sort_order": number,"space_id": string,"status": Database["public"]['Enums']["content_status"],"subtitle": string,"theme": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cover_photo_id"?: string | null,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"intro"?: string,"relationship_date_id": string,"show_countdown"?: boolean,"slug": string,"sort_order"?: number,"space_id": string,"status"?: Database["public"]['Enums']["content_status"],"subtitle"?: string,"theme"?: string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "cover_photo_id"?: string | null,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"intro"?: string,"relationship_date_id"?: string,"show_countdown"?: boolean,"slug"?: string,"sort_order"?: number,"space_id"?: string,"status"?: Database["public"]['Enums']["content_status"],"subtitle"?: string,"theme"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "special_days_cover_photo_id_fkey"
      columns: ["cover_photo_id"]
isOneToOne: false
      referencedRelation: "photos"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "special_days_relationship_date_id_fkey"
      columns: ["relationship_date_id"]
isOneToOne: false
      referencedRelation: "relationship_dates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "special_days_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"theme_settings": {
                  Row: {
                    "data": NonNullable<Json>,"space_id": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "data"?: NonNullable<Json>,"space_id": string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "data"?: NonNullable<Json>,"space_id"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "theme_settings_space_id_fkey"
      columns: ["space_id"]
isOneToOne: true
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"time_capsule_items": {
                  Row: {
                    "asset_id": string,"capsule_id": string,"caption": string,"sort_order": number,"space_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "asset_id": string,"capsule_id": string,"caption"?: string,"sort_order"?: number,"space_id": string
                  }
                  Update: {
                    "asset_id"?: string,"capsule_id"?: string,"caption"?: string,"sort_order"?: number,"space_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "time_capsule_items_asset_id_fkey"
      columns: ["asset_id"]
isOneToOne: false
      referencedRelation: "media_assets"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "time_capsule_items_capsule_id_fkey"
      columns: ["capsule_id"]
isOneToOne: false
      referencedRelation: "time_capsules"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "time_capsule_items_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"time_capsules": {
                  Row: {
                    "cover_style": string,"created_at": string,"created_by": string,"deleted_at": string | null,"id": string,"message": string,"note": string,"space_id": string,"status": Database["public"]['Enums']["content_status"],"title": string,"unlock_at": string,"updated_at": string,"video_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "cover_style"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"message"?: string,"note"?: string,"space_id": string,"status"?: Database["public"]['Enums']["content_status"],"title": string,"unlock_at": string,"updated_at"?: string,"video_url"?: string | null
                  }
                  Update: {
                    "cover_style"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"id"?: string,"message"?: string,"note"?: string,"space_id"?: string,"status"?: Database["public"]['Enums']["content_status"],"title"?: string,"unlock_at"?: string,"updated_at"?: string,"video_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "time_capsules_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"user_preferences": {
                  Row: {
                    "data": NonNullable<Json>,"space_id": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "data"?: NonNullable<Json>,"space_id": string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "data"?: NonNullable<Json>,"space_id"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "user_preferences_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                },"voice_memories": {
                  Row: {
                    "asset_id": string,"created_at": string,"created_by": string,"deleted_at": string | null,"description": string,"duration_ms": number,"id": string,"recorded_on": string,"space_id": string,"status": Database["public"]['Enums']["content_status"],"title": string,"updated_at": string,"waveform": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "asset_id": string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"description"?: string,"duration_ms"?: number,"id"?: string,"recorded_on"?: string,"space_id": string,"status"?: Database["public"]['Enums']["content_status"],"title": string,"updated_at"?: string,"waveform"?: NonNullable<Json>
                  }
                  Update: {
                    "asset_id"?: string,"created_at"?: string,"created_by"?: string,"deleted_at"?: string | null,"description"?: string,"duration_ms"?: number,"id"?: string,"recorded_on"?: string,"space_id"?: string,"status"?: Database["public"]['Enums']["content_status"],"title"?: string,"updated_at"?: string,"waveform"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "voice_memories_asset_id_fkey"
      columns: ["asset_id"]
isOneToOne: false
      referencedRelation: "media_assets"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "voice_memories_space_id_fkey"
      columns: ["space_id"]
isOneToOne: false
      referencedRelation: "private_spaces"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "accept_invite":
{ Args: { "p_profile": Json,"p_token_hash": string,"p_user": string }; Returns: string
                           },
"bootstrap_space":
{ Args: { "p_config": Json,"p_owner": string }; Returns: string
                           },
"check_rate_limit":
{ Args: { "p_key": string,"p_max": number,"p_window_seconds": number }; Returns: boolean
                           },
"ensure_daily_notes":
{ Args: { "p_day": string,"p_space": string }; Returns: undefined
                           },
"sealed_capsules":
{ Args: { "p_space": string }; Returns: {
              "cover_style": string,"created_by": string,"id": string,"title": string,"unlock_at": string
            }[]
                           },
"sealed_editions":
{ Args: { "p_space": string }; Returns: {
              "id": string,"reveal_at": string,"special_day_id": string,"year": number
            }[]
                           },
"sealed_letters":
{ Args: { "p_space": string }; Returns: {
              "category": string,"created_by": string,"envelope_style": string,"id": string,"seal": string,"title": string,"unlock_at": string
            }[]
                           }
          }
          Enums: {
            "content_status": "draft"|"published","member_role": "owner"|"partner"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "content_status": ["draft", "published"],"member_role": ["owner", "partner"]
          }
        }
} as const
