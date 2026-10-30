import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectLanguage } from "../lib/language";

describe("detectLanguage", () => {
  it("reads an English request as English whatever the market", () => {
    assert.equal(
      detectLanguage(
        "We run two dental clinics. Patients book by phone and no-shows are costing us chair time. We want automatic SMS reminders.",
      ),
      "en",
    );
  });

  it("reads a French request as French", () => {
    assert.equal(
      detectLanguage(
        "Nous recevons les demandes de devis par WhatsApp et les recopions à la main dans un tableur.",
      ),
      "fr",
    );
    assert.equal(detectLanguage("Fiduciaire à Genève, nos clients nous envoient leurs pièces comptables par email."), "fr");
  });

  it("falls back to English when nothing tells the languages apart", () => {
    assert.equal(detectLanguage("CRM Odoo WhatsApp API"), "en");
  });
});
