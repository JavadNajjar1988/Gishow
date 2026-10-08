"""Create an explicit proposed destination for every legacy column; no data is transformed."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DESTINATIONS = {
    "Actresses": ("artists", "ID:legacy_id Name:name Image:asset_reference Barname_ID:event_legacy_id DateInsert:created_local"),
    "BankTerminals": ("bank_terminals", "ID:legacy_id Bank_Name_EN:provider_code Bank_Name_FA:title Terminal_ID:terminal_id Merchant_ID:merchant_id Transaction_Key:secret_reference IsActive:is_active IsShow:is_visible DateInsert:created_local"),
    "Barnames": ("events", "ID:legacy_id Name:title DirectorName:director_name RunPeriod:date_range_text RunTime:duration_legacy AboutBarname:description_html DateStartBuyTickets:sales_start_local DateStartInform:publication_start_local IsActive:is_active CauseDeActive:inactive_reason Order_ForShow:display_order PriceChairInShow:display_currency_legacy_label PriceChairInSales:sales_currency_legacy_label LanguageID:language_legacy_id DateInsert:created_local TicketDescription:ticket_description EventLocation:location_legacy_embed"),
    "ChairInBarnames": ("seat_inventory_and_tickets", "ID:legacy_id Barname_ID:event_legacy_id RunTurns_ID:sans_legacy_id Salon_ID:salon_legacy_id Salon_Name:salon_name_snapshot PartOfSalon_ID:part_legacy_id PartOfSalon_Name:part_name_snapshot RowNumber:row_internal RowTitel:row_title ChairNumber:seat_internal ChairsStatus:inventory_state TimeReserve:reservation_clock_local PriceChair:price_minor Factor_ID:order_legacy_id Payment_Finishid:legacy_payment_flag Barcode_RandomCode:legacy_barcode_random UserToken:legacy_reservation_token TrackingFactor:legacy_tracking_code ImageBarCodeName:legacy_barcode_asset RowNumberForShow:row_display ChairNumberForShow:seat_display Checker_Accept:ticket_checked_in Checker_ID:checker_legacy_id Date_Check:checked_in_local Barcode_Data:legacy_barcode Checker_Accept_By:checked_in_by_snapshot"),
    "ChairInParts": ("seats", "ID:legacy_id Salon_ID:salon_legacy_id PartOfSalon_ID:part_legacy_id RowNumber:row_internal RowTitel:row_title ChairNumber:seat_internal ChairsStatus:base_state RowNumberForShow:row_display ChairNumberForShow:seat_display StartChairNumber:start_number"),
    "FactorLists": ("orders_and_payment_history", "ID:legacy_id User_ID:buyer_legacy_id Barname_ID:event_legacy_id RunTurns_ID:sans_legacy_id Salon_ID:salon_legacy_id Part_ID:part_legacy_id ChairCount:seat_count SelectChair_List:legacy_seat_list SumCost_Amount:subtotal_minor SumFactorMarkdown:discount_minor BankTerminal_ID:bank_terminal_legacy_id Order_ID:legacy_gateway_order_id RequestKey:legacy_gateway_request_reference Reference_Number:legacy_gateway_reference AppStatus_Code:legacy_gateway_status_code AppStatus:legacy_gateway_status_text RealTransaction_DateTime:legacy_transaction_local Payment_Finishid:legacy_paid_flag DateInsert:created_local DataInsertInt:created_clock_local UserToken:legacy_reservation_token TrackingFactor:legacy_tracking_code User_Sold_ID:seller_legacy_id DeleteKey:retired_delete_challenge CellPhoneDeleteKey:retired_delete_phone DeleteFactor:is_deleted_legacy DateDeleteFactor:deleted_local"),
    "FactorMarkdowns": ("applied_discounts", "ID:legacy_id Factor_ID:order_legacy_id Markdown_ID:discount_legacy_id Markdown_Code:code_snapshot Markdown_Count:legacy_count Factor_SumPrice:subtotal_minor Markdown_SumPrice:discount_minor Markdown_Class:kind_snapshot Markdown_Price_Unit:value_snapshot TimeReserve:reservation_clock_local Payment_Finishid:legacy_payment_flag UserToken:legacy_reservation_token"),
    "ImageBarnames": ("event_assets", "ID:legacy_id ImageName:asset_reference Barname_ID:event_legacy_id DateInsert:created_local"),
    "ImagesMadareks": ("event_documents", "ID:legacy_id ImageCaption:caption ImageName:asset_reference Barname_ID:event_legacy_id DateInsert:created_local"),
    "Languages": ("languages", "ID:legacy_id LanguageName:legacy_name"),
    "MarkdownLists": ("discounts", "ID:legacy_id Barname_ID:event_legacy_id Markdown_Code:code Markdown_Count:legacy_count Markdown_Class:kind Markdown_Price_Unit:value Condition_MinimumChair:minimum_seats IsActive:is_active DateInsert:created_local"),
    "PartOfSalons": ("salon_parts", "ID:legacy_id Salon_ID:salon_legacy_id Name:name Floor:floor_legacy Side:side_legacy RowPart:row_definition_legacy CountChairs:seat_count DirectionChair:orientation_legacy PartMapPointList:geometry_legacy DateInsert:created_local"),
    "RoleAccessLevels": ("permission_definitions", "ID:legacy_id Role_ID:role_legacy_id AccessLevel_Name:code AccessLevel_Titel:title Order_Item:display_order Group_Item:group_legacy DefuoltAccess:default_allowed"),
    "RoleLists": ("roles", "ID:legacy_id RoleName:code RoleTitel:title"),
    "RunTurns": ("sanses", "ID:legacy_id DateRun:date_text_legacy TimeRun:time_local Barname_ID:event_legacy_id Salon_ID:salon_legacy_id DateInsert:created_local IsShow:is_visible EventLocation:location_legacy_embed TemporaryReservation:assisted_reservation_enabled MessageTemporaryReservation:assisted_reservation_message"),
    "Salons": ("salons", "ID:legacy_id Name:name Address:address IsActive:is_active IsPlanShow:plan_visible PlanImageName:plan_asset_reference DateInsert:created_local"),
    "SettingSites": ("site_settings", "ID:legacy_id KavehnegarMerchent:sms_secret_reference DollarPrice:legacy_fx_rate BuyingGuide:buying_guide_html PurchaseRules:purchase_rules_html AboutMe:about_html SecurePaymentGuide:secure_payment_guide_html Faq:faq_html ContactUs:contact_html Cooperatewithus:cooperation_html TimeResetServer:server_timeout_legacy TimeResetClient:client_timeout_legacy TemplateName:template_legacy CountChoiceChair:max_seats_per_order AdminCellPhone:admin_phone SupportLink:support_link SiteSignature:footer_signature SiteSignatureLink:footer_signature_link CallSupport:support_contact CallSupportType:support_contact_type WhatsAppSupportSalesLink:sales_support_link WhatsAppSupportSalesDescription:sales_support_description WhatsAppFollowUpLink:tracking_support_link WhatsAppFollowUpDescription:tracking_support_description"),
    "SlideShows": ("slides", "ID:legacy_id ImageName:asset_reference Order_ForShow:display_order IsShow:is_visible DateInsert:created_local"),
    "UserAccessBarnames": ("event_permissions", "ID:legacy_id User_ID:user_legacy_id Barname_ID:event_legacy_id Role_ID:role_legacy_id"),
    "UserLists": ("users", "ID:legacy_id FullName:full_name CountryCode:country_code Mobile:phone_normalization_input Password:reset_required_without_digest_import CodeNumber:retired_recovery_code IsActive:is_active Image:avatar_reference DateInsert:created_local"),
    "UserRoleAccessLevels": ("user_permission_overrides", "ID:legacy_id RoleAccessLevel_ID:permission_legacy_id User_ID:user_legacy_id Role_ID:role_legacy_id"),
    "UserRoles": ("user_roles", "ID:legacy_id Role_ID:role_legacy_id User_ID:user_legacy_id TestNewField:preserved_legacy_extension"),
}


def main():
    schema = json.loads((ROOT / "docs/audit/legacy-database-schema.json").read_text(encoding="utf-8"))
    columns = []
    for column in schema["columns"]:
        table, name = column["table_name"], column["column_name"]
        if table == "__MigrationHistory":
            entity, field, rule = "archive_only", name, "do_not_replay_old_framework_migrations"
        else:
            entity, pairs = DESTINATIONS[table]
            mapping = dict(pair.split(":", 1) for pair in pairs.split())
            if name not in mapping:
                raise ValueError(f"Unmapped column {table}.{name}")
            field = mapping[name]
            rule = "preserve_exact_value_and_legacy_identity"
            if field.endswith("_legacy_id"):
                rule = "resolve_through_explicit_legacy_identity_map_no_missing_reference_guess"
            elif field.endswith("_minor"):
                rule = "integer_IRR_from_legacy_toman_times_10_checked_overflow"
            elif field.endswith("_local") and "clock" not in field:
                rule = "preserve_source_text_parse_solar_calendar_no_implicit_UTC"
            elif "clock_local" in field:
                rule = "parse_12_digit_solar_YYYYMMDDHHmm_zero_means_unset_not_epoch"
            elif "secret_reference" in field:
                rule = "private_secret_store_no_plaintext_export"
            elif field in ("value", "value_snapshot"):
                rule = "branch_by_discount_kind_percent_unchanged_fixed_amount_times_10"
            elif field in ("inventory_state", "base_state"):
                rule = "explicit_six_state_map_keep_virtual_and_deleted_distinct"
            elif field == "reset_required_without_digest_import":
                rule = "do_not_import_MD5_as_active_password_require_verified_account_recovery"
            elif field == "legacy_reservation_token":
                rule = "archive_only_never_reactivate_legacy_session_or_reservation_tokens"
            elif field.startswith("retired_"):
                rule = "do_not_activate_legacy_security_challenges_keep_original_backup"
            elif field == "phone_normalization_input":
                rule = "country_aware_text_normalization_quarantine_invalid_or_colliding_accounts_no_merge"
            elif field in ("date_text_legacy", "legacy_count", "server_timeout_legacy", "client_timeout_legacy", "duration_legacy", "preserved_legacy_extension"):
                rule = "preserve_source_value_semantics_require_review"
        columns.append({"legacy_table": table, "legacy_column": name, "legacy_type": column["data_type"],
                        "legacy_nullable": column["is_nullable"], "proposed_entity": entity,
                        "proposed_field": field, "conversion_rule": rule,
                        "status": "proposed_not_implemented"})
    assert len(columns) == len(schema["columns"])
    report = {"backup_sha256": schema["backup_sha256"], "column_count": len(columns),
              "scope": "Complete source-column coverage; proposed destinations, not an executable importer",
              "canonical_money_unit": "IRR", "source_money_unit": "legacy_toman",
              "columns": columns,
              "import_gate": "closed_pending_implementation_and_quarantine_review"}
    (ROOT / "docs/audit/legacy-column-contract.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(f"Explicit proposed destinations recorded for all {len(columns)} columns.")


if __name__ == "__main__":
    main()
