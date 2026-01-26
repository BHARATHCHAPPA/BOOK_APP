// Test with explicit .js extension (TypeScript will look for .ts)
import { IChild } from '../domain/models.js';
import { DynamoChildRepository } from '../infrastructure/database/DynamoChildRepository.js';

console.log('Imports work!');
