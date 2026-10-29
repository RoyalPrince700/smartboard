/**
 * Mathematics subject registration.
 */

import { SubjectRegistration } from '../../types';
import { quadraticTopic } from './quadratic';
import { linearTopic } from './linear';
import { geometryTopic } from './geometry';
import { trigonometryTopic } from './trigonometry';
import { exponentialTopic } from './exponential';
import { absoluteValueTopic } from './absolute_value';
import { simultaneousTopic } from './simultaneous';
import { arithmeticTopic } from './arithmetic';
import { probabilityTopic } from './probability';
import { mathIntentDetectors } from './intentDetectors';
import { intentRegistry } from '../../intent/intentRegistry';

intentRegistry.registerAll('math', mathIntentDetectors);

export const mathSubject: SubjectRegistration = {
  id: 'math',
  label: 'Mathematics',
  topics: [
    quadraticTopic,
    linearTopic,
    exponentialTopic,
    absoluteValueTopic,
    simultaneousTopic,
    arithmeticTopic,
    probabilityTopic,
    geometryTopic,
    trigonometryTopic,
  ],
  intentDetectors: mathIntentDetectors,
};

export {
  quadraticTopic,
  linearTopic,
  exponentialTopic,
  absoluteValueTopic,
  simultaneousTopic,
  arithmeticTopic,
  probabilityTopic,
  geometryTopic,
  trigonometryTopic,
};
