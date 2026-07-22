const express = require('express')
const router = express.Router()
const { createAssignment, listAssignments, getAssignment, deleteAssignment } = require('../controllers/substituteController')

router.post('/', createAssignment)
router.get('/', listAssignments)
router.get('/:id', getAssignment)
router.delete('/:id', deleteAssignment)

module.exports = router
