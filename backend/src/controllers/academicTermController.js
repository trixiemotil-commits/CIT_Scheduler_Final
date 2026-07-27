const AcademicTerm = require("../models/AcademicTerm");

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRoomList(value) {
  if (!Array.isArray(value)) return [];
  const normalized = value
    .map((item) => {
      if (!item) return null;
      if (typeof item === 'string') {
        const name = normalizeString(item)
        return name ? { name, type: 'Lecture' } : null
      }
      if (typeof item === 'object') {
        const name = normalizeString(item.name)
        const type = ['Lecture', 'Comlab'].includes(normalizeString(item.type)) ? normalizeString(item.type) : 'Lecture'
        return name ? { name, type } : null
      }
      return null
    })
    .filter(Boolean)

  return normalized.filter((room, index, source) => source.findIndex((item) => item.name === room.name) === index)
}

function normalizeSectionCounts(value) {
  const source = value && typeof value === 'object' ? value : {}
  const next = {}
  Object.entries(source).forEach(([yearKey, count]) => {
    const year = normalizeString(yearKey)
    const numeric = Number(count)
    if (!year || Number.isNaN(numeric) || numeric < 1) return
    next[year] = Math.min(10, Math.max(1, Math.floor(numeric)))
  })
  return next
}

function normalizeSectionNames(value) {
  const source = value && typeof value === 'object' ? value : {}
  const next = {}
  Object.entries(source).forEach(([yearKey, sectionList]) => {
    const year = normalizeString(yearKey)
    if (!year || !Array.isArray(sectionList)) return
    const names = sectionList
      .map((item) => normalizeString(item))
      .filter(Boolean)
    if (names.length) {
      next[year] = names
    }
  })
  return next
}

function getTermKey(schoolYear, semester) {
  return `${normalizeString(schoolYear)}|${normalizeString(semester)}`;
}

async function listTerms(req, res) {
  try {
    const terms = await AcademicTerm.find().sort({ createdAt: -1 }).lean();
    return res.json({ terms });
  } catch (error) {
    console.error("Failed to list academic terms:", error);
    return res.status(500).json({ message: "Failed to load academic terms.", error: error.message });
  }
}

async function getInUseTerm(_req, res) {
  try {
    const term = await AcademicTerm.findOne({ isInUse: true }).sort({ usedAt: -1, createdAt: -1 }).lean();
    return res.json({ term });
  } catch (error) {
    console.error("Failed to load in-use academic term:", error);
    return res.status(500).json({ message: "Failed to load in-use academic term.", error: error.message });
  }
}

async function getPublishedTerm(_req, res) {
  try {
    const term = await AcademicTerm.findOne({ isPublished: true }).sort({ publishedAt: -1, createdAt: -1 }).lean();
    return res.json({ term });
  } catch (error) {
    console.error("Failed to load published academic term:", error);
    return res.status(500).json({ message: "Failed to load published academic term.", error: error.message });
  }
}

async function createTerm(req, res) {
  try {
    const schoolYear = normalizeString(req.body?.schoolYear);
    const semester = normalizeString(req.body?.semester);

    if (!schoolYear || !semester) {
      return res.status(400).json({ message: "School year and semester are required." });
    }

    const existing = await AcademicTerm.findOne({ schoolYear, semester });
    if (existing) {
      return res.status(409).json({ message: "That school year and semester already exists." });
    }

    const term = await AcademicTerm.create({
      schoolYear,
      semester,
      sectionCounts: normalizeSectionCounts(req.body?.sectionCounts),
      sectionNames: normalizeSectionNames(req.body?.sectionNames),
      rooms: normalizeRoomList(req.body?.rooms),
      createdBy: normalizeString(req.body?.createdBy),
    });

    return res.status(201).json({ term });
  } catch (error) {
    console.error("Failed to create academic term:", error);
    return res.status(500).json({ message: "Failed to create academic term.", error: error.message });
  }
}

async function updateTerm(req, res) {
  try {
    const termId = normalizeString(req.params?.id);
    if (!termId) {
      return res.status(400).json({ message: "Invalid term id." });
    }

    const term = await AcademicTerm.findById(termId);
    if (!term) {
      return res.status(404).json({ message: "Academic term not found." });
    }

    const nextIsPublished = Boolean(req.body?.isPublished);
    const payload = {
      sectionCounts: normalizeSectionCounts(req.body?.sectionCounts),
      sectionNames: normalizeSectionNames(req.body?.sectionNames),
      rooms: normalizeRoomList(req.body?.rooms),
      createdBy: normalizeString(req.body?.createdBy || term.createdBy),
    };

    if (nextIsPublished) {
      payload.isPublished = true;
      payload.publishedAt = new Date();
    } else if (req.body?.isPublished === false) {
      payload.isPublished = false;
      payload.publishedAt = null;
    }

    if (req.body?.schoolYear) {
      payload.schoolYear = normalizeString(req.body.schoolYear);
    }
    if (req.body?.semester) {
      payload.semester = normalizeString(req.body.semester);
    }

    Object.assign(term, payload);
    await term.save();
    return res.json({ term });
  } catch (error) {
    console.error("Failed to update academic term:", error);
    return res.status(500).json({ message: "Failed to update academic term.", error: error.message });
  }
}

async function useTerm(req, res) {
  try {
    const termId = normalizeString(req.params?.id);
    if (!termId) {
      return res.status(400).json({ message: "Invalid term id." });
    }

    const target = await AcademicTerm.findById(termId);
    if (!target) {
      return res.status(404).json({ message: "Academic term not found." });
    }

    await AcademicTerm.updateMany({}, { $set: { isInUse: false, usedAt: null } });
    target.isInUse = true;
    target.usedAt = new Date();
    await target.save();

    return res.json({ term: target });
  } catch (error) {
    console.error("Failed to set academic term in use:", error);
    return res.status(500).json({ message: "Failed to set academic term in use.", error: error.message });
  }
}

async function publishTerm(req, res) {
  try {
    const termId = normalizeString(req.params?.id);
    if (!termId) {
      return res.status(400).json({ message: "Invalid term id." });
    }

    const target = await AcademicTerm.findById(termId);
    if (!target) {
      return res.status(404).json({ message: "Academic term not found." });
    }

    await AcademicTerm.updateMany({}, { $set: { isPublished: false, publishedAt: null } });
    target.isPublished = true;
    target.publishedAt = new Date();
    await target.save();

    return res.json({ term: target });
  } catch (error) {
    console.error("Failed to publish academic term:", error);
    return res.status(500).json({ message: "Failed to publish academic term.", error: error.message });
  }
}

module.exports = {
  listTerms,
  getInUseTerm,
  getPublishedTerm,
  createTerm,
  updateTerm,
  useTerm,
  publishTerm,
  getTermKey,
};
