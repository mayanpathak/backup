import { Router } from 'express';
import { body } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import * as authMiddleWare from '../middleware/auth.middleware.js';
import * as messageController from '../controllers/message.controller.js';

const router = Router();


router.post('/create',
    authMiddleWare.authUser,
    body('name').isString().withMessage('Name is required')
        .notEmpty().withMessage('Project name cannot be empty')
        .trim(),
    projectController.createProject
)

router.get('/all',
    authMiddleWare.authUser,
    projectController.getAllProject
)

router.put('/add-user',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('users').isArray({ min: 1 }).withMessage('Users must be an array with at least one user'),
    projectController.addUserToProject
)

router.get('/get-project/:projectId',
    authMiddleWare.authUser,
    projectController.getProjectById
)

router.put('/update-file-tree',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('fileTree').isObject().withMessage('File tree is required'),
    projectController.updateFileTree
)

router.delete('/delete-project/:projectId',
    authMiddleWare.authUser,
    projectController.deleteProject
)

// Message operations
router.get('/:projectId/messages', authMiddleWare.authUser, messageController.getProjectMessages);
router.post('/:projectId/messages/search', authMiddleWare.authUser, messageController.searchProjectMessages);
router.delete('/:projectId/messages', authMiddleWare.authUser, messageController.clearProjectMessages);
router.get('/:projectId/messages/count', authMiddleWare.authUser, messageController.getProjectMessageCount);

export default router;