import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { priceDraft } from "../lib/pricing";
import type { QuoteDraft, Source } from "../lib/quoteSchema";
import { liftInlineCitations } from "../lib/text";

const sources: Source[] = [1, 3, 4, 6, 7].map((id) => ({
  id,
  title: `Source ${id}`,
  url: `https://example.com/${id}`,
  domain: "example.com",
}));

const draft: QuoteDraft = {
  language: "en",
  title: "SMS reminders for dental clinics",
  summary: "Automated reminders with one-tap confirmation.",
  modules: [
    { name: "Reminder engine", description: "Sends SMS through Twilio【4†twilio.com】.", hoursLow: 20, hoursHigh: 35, sources: [1] },
    { name: "Waitlist", description: "Offers freed slots to the waitlist.", hoursLow: 15, hoursHigh: 25, sources: [] },
  ],
  rate: {
    low: 80,
    high: 150,
    rationale: "US freelance rates range from $60-$175 per hour【1†Loxala】, a blended band of $80-$150 fits.",
    sources: [1],
  },
  monthlySupportHours: 4,
  tools: [{ name: "Twilio SMS API", role: "Pricing starts at $0.0083 per message【3†textbee.dev】【4†twilio.com】.", sources: [3, 4] }],
  compliance: [
    { note: "Only name and appointment time may be included [6†fransis.ai] 【7†appointmentreminder.com】.", sources: [6] },
  ],
  assumptions: ["Phone numbers are already collected【9†nowhere】."],
  questions: ["How are appointments exported?"],
  nextStep: "Schedule a discovery call.",
};

describe("inline citation marks", () => {
  it("lifts Nemotron's marks out of the text and keeps their ids", () => {
    assert.deepEqual(liftInlineCitations("per hour【1†Loxala】, a blended band"), {
      text: "per hour, a blended band",
      ids: [1],
    });
    assert.deepEqual(liftInlineCitations("Market rate from [1]."), { text: "Market rate from [1].", ids: [] });
  });

  it("never shows a mark on the quote and cites only retrieved sources", () => {
    const { quote, droppedCitations } = priceDraft(draft, "united-states", sources, new Date("2026-10-30T08:00:00Z"));
    const visible = JSON.stringify({ ...quote, sources: [] });
    assert.ok(!/[【】†]/.test(visible), visible);

    assert.equal(quote.rate.rationale, "US freelance rates range from $60-$175 per hour, a blended band of $80-$150 fits.");
    assert.deepEqual(quote.lines[0]?.sources, [1, 4]);
    assert.deepEqual(quote.tools[0]?.sources, [3, 4]);
    assert.equal(quote.compliance[0]?.note, "Only name and appointment time may be included.");
    assert.deepEqual(quote.compliance[0]?.sources, [6, 7]);
    assert.equal(quote.assumptions[0], "Phone numbers are already collected.");
    assert.equal(droppedCitations, 0);
  });
});
