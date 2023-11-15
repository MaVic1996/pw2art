

import { test } from '@playwright/test';
import { notLoggedIn, loggedIn } from '../load_tests/scripts/navigation';
import config from '../../playwright.config';
import { appScenario, app } from '../support/on-rails';

const credentials = {
  email: 'darin@marks-price.test',
  password: 'no3m66iqnrf58ct'
};

test.describe('Navigation', () => {
  test.afterAll(async()=> {
    console.log('afte')
    await app('delete', {model: 'Usuario'});
  })

  test('Not Logged In', async ({ page }) => {
    appScenario('navigation');
    await notLoggedIn(page, config.use.frontendURL);
  });
  
  test('Logged in', async({page}) => {
    appScenario('navigation');
    await loggedIn(page);
  });
});