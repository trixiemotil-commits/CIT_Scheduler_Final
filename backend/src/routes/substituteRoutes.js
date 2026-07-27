const express = require('express')
const router = express.Router()
const {
  createAssignment,
  listAssignments,
  getAssignment,
  deleteAssignment,
  deleteAssignmentsForTeacher,
  syncAssignments,
} = require('../controllers/substituteController')
const { authRequired, authorizeRoles } = require('../middleware/authMiddleware')

router.get('/', authRequired, authorizeRoles('admin', 'teacher'), listAssignments)
router.get('/:id', authRequired, authorizeRoles('admin', 'teacher'), getAssignment)
router.post('/', authRequired, authorizeRoles('admin'), createAssignment)
router.put('/', authRequired, authorizeRoles('admin'), syncAssignments)
router.delete('/', authRequired, authorizeRoles('admin'), deleteAssignmentsForTeacher)
router.delete('/:id', authRequired, authorizeRoles('admin'), deleteAssignment)

module.exports = router
