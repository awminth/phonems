const express = require('express');
const router = express.Router();
const technicianController = require('../controllers/technician.controller');

router.get('/', technicianController.getTechnicians);
router.get('/dropdown', technicianController.getTechnicianDropdown);
router.get('/:id', technicianController.getTechnicianById);
router.post('/', technicianController.createTechnician);
router.put('/:id', technicianController.updateTechnician);
router.delete('/:id', technicianController.deleteTechnician);

module.exports = router;
