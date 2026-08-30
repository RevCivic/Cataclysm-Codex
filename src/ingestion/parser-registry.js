'use strict';

const { parseSpeciesWorkbook } = require('./parsers/species');
const { parseEquipmentWorkbook } = require('./parsers/equipment');
const { parseShipClassesWorkbook } = require('./parsers/ship-classes');
const { parseHistoricalTimeline, parseLoreDocument } = require('./parsers/documents');
const { parseCampaignWorkbook } = require('./parsers/campaign');

const parsers = {
  'species-v1': async file => {
    const parsed = await parseSpeciesWorkbook(file);
    return { ...parsed, collections: { species: parsed.species }, aliases: parsed.aliases };
  },
  'equipment-v1': parseEquipmentWorkbook,
  'ship-classes-v1': parseShipClassesWorkbook,
  'lore-document-v1': parseLoreDocument,
  'historical-timeline-v1': parseHistoricalTimeline,
  'campaign-v1': parseCampaignWorkbook
};

function supportsParser(name) { return Boolean(parsers[name]); }

async function parseSourceSnapshot(source, snapshot) {
  const parser = parsers[source.parser];
  if (!parser) throw new Error(`Preview is not implemented for ${source.parser}`);
  return parser(snapshot.dataFile);
}

module.exports = { parseSourceSnapshot, supportsParser };
