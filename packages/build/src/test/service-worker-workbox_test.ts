/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

// TODO Migrate to async tests.

import { assert } from 'chai';
import * as fs from 'mz/fs';
import * as path from 'path';
import * as vfs from 'vinyl-fs';

import { LocalFsPath } from '../path-transformers';
import { PolymerProject } from '../polymer-project';
import * as serviceWorker from '../service-worker-workbox';
import { WorkboxConfig } from 'workbox-build';

const temp = require('temp').track();
const mergeStream = require('merge-stream');

suite('workbox', () => {
  let testBuildRoot: LocalFsPath;
  let defaultProject: PolymerProject;

  setup((done) => {
    defaultProject = new PolymerProject({
      root: path.resolve('test-fixtures/test-project'),
      entrypoint: 'index.html',
      shell: 'shell.html',
      sources: [
        'source-dir/**',
      ],
    });

    temp.mkdir('polymer-build-test', (err: Error, dir?: string) => {
      if (err || dir === undefined) {
        return done(err || 'no dir given');
      }
      testBuildRoot = dir as LocalFsPath;
      vfs.src(path.join('test-fixtures/test-project/**'))
        .pipe(vfs.dest(dir))
        .on('end', () => {
          mergeStream(defaultProject.sources(), defaultProject.dependencies())
            .pipe(vfs.dest(testBuildRoot))
            .on('end', () => done())
            .on('error', done);
        });
    });
  });

  teardown(done => {
    temp.cleanup(done);
  });

  suite('hasNoFileExtension regexp', () => {
    test('matches URL paths correctly', () => {
      const test = (s: string) => serviceWorker.hasNoFileExtension.test(s);

      assert.isTrue(test('/'));
      assert.isTrue(test('/foo'));
      assert.isTrue(test('/foo/'));
      assert.isTrue(test('/foo.png/bar/'));
      assert.isTrue(test('/foo?baz.png'));

      assert.isFalse(test('/foo.png'));
      assert.isFalse(test('/foo/bar.png'));
    });
  });

  suite('generateServiceWorkerConfig()', () => {
    test('should set entrypoint related options', async () => {
      const config = await serviceWorker.generateServiceWorkerConfig({
        project: defaultProject,
        buildRoot: testBuildRoot,
      });
      assert.equal(config.navigateFallback, 'index.html');
      assert.deepEqual(
        config.navigateFallbackWhitelist, [serviceWorker.hasNoFileExtension]);
    });
  });

  suite('generateWorkboxServiceWorker()', () => {
    test('should throw when options are not provided', () => {
      // tslint:disable-next-line: no-any testing type unsafe code
      return (serviceWorker.generateWorkboxServiceWorker as any)().then(
        () => {
          assert.fail(
            'generateWorkboxServiceWorker() resolved, expected rejection!');
        },
        (error: Error) => {
          assert.include(error.name, 'AssertionError');
          assert.equal(
            error.message, '`project` & `buildRoot` options are required');
        });
    });

    test('should throw when options.project is not provided', () => {
      // tslint:disable-next-line: no-any testing type unsafe code
      const unsafeForm = (serviceWorker.generateWorkboxServiceWorker as any);
      return unsafeForm({ buildRoot: testBuildRoot })
        .then(
          () => {
            assert.fail(
              'generateWorkboxServiceWorker() resolved, expected rejection!');
          },
          (error: Error) => {
            assert.include(error.name, 'AssertionError');
            assert.equal(error.message, '`project` option is required');
          });
    });

    test('should throw when options.buildRoot is not provided', () => {
      // tslint:disable-next-line: no-any testing type unsafe code
      const unsafeForm = (serviceWorker.generateWorkboxServiceWorker as any);
      return unsafeForm({ project: defaultProject })
        .then(
          () => {
            assert.fail(
              'generateWorkboxServiceWorker() resolved, expected rejection!');
          },
          (error: Error) => {
            assert.include(error.name, 'AssertionError');
            assert.equal(error.message, '`buildRoot` option is required');
          });
    });

    test('should not modify the options object provided when called', () => {
      const workboxConfig = { globPatterns: <string[]>[] };
      return serviceWorker
        .generateServiceWorkerConfig({
          project: defaultProject,
          buildRoot: testBuildRoot,
          workboxConfig: workboxConfig,
        })
        .then((config: WorkboxConfig) => {
          assert.isDefined(config.globPatterns);
          config.globPatterns && assert.equal(config.globPatterns.length, 0);
        });
    });

    test(
      'should add unbundled precached assets when options.unbundled is not provided',
      () => {
        return serviceWorker
          .generateWorkboxServiceWorker({
            project: defaultProject,
            buildRoot: testBuildRoot,
          })
          .then((swFile: Buffer) => {
            const fileContents = swFile.toString();
            assert.include(fileContents, '"index.html"');
            assert.include(fileContents, '"shell.html"');
            assert.include(fileContents, '"bower_components/dep.html"');
            assert.notInclude(fileContents, '"source-dir/my-app.html"');
          });
      });

    test(
      'should add bundled precached assets when options.bundled is provided',
      () => {
        return serviceWorker
          .generateWorkboxServiceWorker({
            project: defaultProject,
            buildRoot: testBuildRoot,
            bundled: true,
          })
          .then((swFile: Buffer) => {
            const fileContents = swFile.toString();
            assert.include(fileContents, '"index.html"');
            assert.include(fileContents, '"shell.html"');
            assert.notInclude(fileContents, '"bower_components/dep.html"');
            assert.notInclude(fileContents, '"source-dir/my-app.html"');
          });
      });

    test('should add provided globPatterns paths to the final list', () => {
      return serviceWorker
        .generateWorkboxServiceWorker({
          project: defaultProject,
          buildRoot: testBuildRoot,
          bundled: true,
          workboxConfig: {
            globPatterns: ['**/*.html'],
          },
        })
        .then((swFile: Buffer) => {
          const fileContents = swFile.toString();
          assert.include(fileContents, '"index.html"');
          assert.include(fileContents, '"shell.html"');
          assert.include(fileContents, '"bower_components/dep.html"');
          assert.notInclude(fileContents, '"gulpfile.js"');
        });
    }
    );

    test('basePath should prefix resources', () => {
      return serviceWorker
        .generateWorkboxServiceWorker({
          project: defaultProject,
          buildRoot: testBuildRoot,
          basePath: '/my/base/path' as LocalFsPath
        })
        .then((swFile: Buffer) => {
          const fileContents = swFile.toString();
          assert.include(fileContents, '"/my/base/path/index.html"');
        });
    });

    test('basePath prefixes should not have double delimiters', () => {
      return serviceWorker
        .generateWorkboxServiceWorker({
          project: defaultProject,
          buildRoot: testBuildRoot,
          basePath: '/my/base/path/' as LocalFsPath,
        })
        .then((swFile: Buffer) => {
          const fileContents = swFile.toString();
          assert.include(fileContents, '"/my/base/path/index.html"');
          assert.notInclude(fileContents, '"/my/base/path//index.html"');
        });
    });
  });

  suite('addWorkboxServiceWorker()', () => {
    test('should write generated service worker to file system', () => {
      return serviceWorker
        .addWorkboxServiceWorker({
          project: defaultProject,
          buildRoot: testBuildRoot,
        })
        .then(() => {
          const content = fs.readFileSync(
            path.join(testBuildRoot, 'service-worker.js'), 'utf-8');
          assert.include(
            content,
            'Welcome to your Workbox-powered service worker!');
        });
    });
  });
});
