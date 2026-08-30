'use strict';

const mammoth = require('mammoth');

async function paragraphs(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value.split(/\r?\n/).map(value => value.trim()).filter(Boolean);
}

function loreFromParagraphs(values) {
  const loreDocuments = [{
    sourceRecordKey: 'document', sourceLocator: 'document', title: 'Constitution of the Galactic Accord',
    document_kind: 'constitution', ruleset: 'system_neutral', content_origin: 'homebrew'
  }];
  let article = null;
  let section = null;
  const loreSections = values.map((body, index) => {
    const articleMatch = body.match(/^Article\s+(\d+)\.?\s*(.*)$/i);
    const sectionMatch = body.match(/^Section\s+(\d+)\.?\s*(.*)$/i);
    if (articleMatch) { article = Number(articleMatch[1]); section = null; }
    if (sectionMatch) section = Number(sectionMatch[1]);
    return {
      sourceRecordKey: `paragraph:${index + 1}`, sourceLocator: `paragraph:${index + 1}`,
      document_source_key: 'document', position: index + 1, article_number: article,
      section_number: section, heading: articleMatch || sectionMatch ? body : null,
      body: articleMatch || sectionMatch ? null : body
    };
  });
  return { parser: 'lore-document-v1', collections: { loreDocuments, loreSections }, issues: [] };
}

async function parseLoreDocument(filePath) {
  return loreFromParagraphs(await paragraphs(filePath));
}

function historicalTimelineFromParagraphs(values) {
  const events = [];
  const issues = [];
  values.forEach((raw, index) => {
    const match = raw.match(/^(\d{4})(?:\s*[-–—]\s*(\d{4}))?\s*[-–—]\s*(.+)$/);
    if (!match) {
      issues.push({ severity: 'warning', code: 'unparsed_date', sourceLocator: `paragraph:${index + 1}`, rawValue: raw });
      return;
    }
    events.push({
      sourceRecordKey: `paragraph:${index + 1}`, sourceLocator: `paragraph:${index + 1}`,
      title: match[3].split(/[.;]/, 1)[0].slice(0, 160), description: match[3],
      start_year: Number(match[1]), end_year: match[2] ? Number(match[2]) : Number(match[1]),
      date_precision: match[2] ? 'year_range' : 'year', raw_date: match[2] ? `${match[1]}-${match[2]}` : match[1],
      event_kind: 'world_history', ruleset: 'system_neutral', content_origin: 'homebrew'
    });
  });
  return { parser: 'historical-timeline-v1', collections: { events }, issues };
}

async function parseHistoricalTimeline(filePath) {
  return historicalTimelineFromParagraphs(await paragraphs(filePath));
}

module.exports = {
  historicalTimelineFromParagraphs, loreFromParagraphs, parseHistoricalTimeline, parseLoreDocument
};
