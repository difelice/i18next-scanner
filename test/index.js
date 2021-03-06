import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import gulp from 'gulp';
import tap from 'gulp-tap';
import VirtualFile from 'vinyl';
import { test } from 'tap';
import scanner from '../src';

const defaults = {
    debug: false,
    func: {
        list: ['_t']
    },
    lngs: ['en','de'],
    ns: [
        'locale',
        'resource'
    ],
    defaultNs: 'resource',
    defaultValue: '__STRING_NOT_TRANSLATED__',
    resource: {
        loadPath: '',
        savePath: 'i18n/{{lng}}/{{ns}}.json'
    },
    nsSeparator: false, // namespace separator
    keySeparator: false, // key separator
    interpolation: {
        prefix: '{{',
        suffix: '}}'
    }
};

test('Parse both .html and .js files', (t) => {
    const options = _.merge({}, defaults, {});
    const list = [
        'test/fixtures/app.html',
        'test/fixtures/modules/**/*.js'
    ];

    gulp.src(list)
        .pipe(scanner(options))
        .pipe(tap(function(file) {
            const contents = file.contents.toString();
            const list = [
                'i18n/de/resource.json',
                'i18n/en/resource.json',
            ];

            if (_.includes(list, file.path)) {
                const found = JSON.parse(contents);
                const wanted = {
                    "Loading...": "__STRING_NOT_TRANSLATED__",
                    "This value does not exist.": "__STRING_NOT_TRANSLATED__",
                    "You have {{count}} messages.": "__STRING_NOT_TRANSLATED__",
                    "You have {{count}} messages._plural": "__STRING_NOT_TRANSLATED__",
                    "YouTube has more than {{count}} billion users.": "__STRING_NOT_TRANSLATED__",
                    "YouTube has more than {{count}} billion users._plural": "__STRING_NOT_TRANSLATED__",
                    'key4': '__STRING_NOT_TRANSLATED__',
                    'key3': '__STRING_NOT_TRANSLATED__',
                    'key2': '__STRING_NOT_TRANSLATED__',
                    'key1': '__STRING_NOT_TRANSLATED__'
                };
                t.same(found, wanted);
            }
        }))
        .on('end', function() {
            t.end();
        });
});

test('[Key Based Fallback] defaultValue as string', function(t) {
    const options = _.merge({}, defaults, {
        func: {
            extensions: ['.js'] // with extensions
        }
    });

    gulp.src('test/fixtures/modules/**/*.js')
        .pipe(scanner(options))
        .pipe(tap(function(file) {
            const contents = file.contents.toString();
            const list = [
                'i18n/de/resource.json',
                'i18n/en/resource.json',
            ];

            if (_.includes(list, file.path)) {
                const found = JSON.parse(contents);
                const wanted = {
                  "Loading...": "__STRING_NOT_TRANSLATED__",
                  "This value does not exist.": "__STRING_NOT_TRANSLATED__",
                  "YouTube has more than {{count}} billion users.": "__STRING_NOT_TRANSLATED__",
                  "YouTube has more than {{count}} billion users._plural": "__STRING_NOT_TRANSLATED__",
                  "You have {{count}} messages.": "__STRING_NOT_TRANSLATED__",
                  "You have {{count}} messages._plural": "__STRING_NOT_TRANSLATED__"
                };
                t.same(found, wanted);
            }
        }))
        .on('end', function() {
            t.end();
        });
});

test('[Key Based Fallback] defaultValue as function', function(t) {
    const options = _.merge({}, defaults, {
        defaultValue: function(lng, ns, key) {
            if (lng === 'en') {
                return key;
            }
            return '__STRING_NOT_TRANSLATED__';
        },
        func: {
            extensions: ['.js'] // with extensions
        }
    });

    gulp.src('test/fixtures/modules/**/*.js')
        .pipe(scanner(options))
        .pipe(tap(function(file) {
            const contents = file.contents.toString();

            if (file.path === 'i18n/en/resource.json') {
                const found = JSON.parse(contents);
                const wanted = {
                  "Loading...": "Loading...",
                  "This value does not exist.": "This value does not exist.",
                  "YouTube has more than {{count}} billion users.": "YouTube has more than {{count}} billion users.",
                  "YouTube has more than {{count}} billion users._plural": "YouTube has more than {{count}} billion users.",
                  "You have {{count}} messages.": "You have {{count}} messages.",
                  "You have {{count}} messages._plural": "You have {{count}} messages."
                };
                t.same(found, wanted);
            }

            if (file.path === 'i18n/de/resource.json') {
                const found = JSON.parse(contents);
                const wanted = {
                  "Loading...": "__STRING_NOT_TRANSLATED__",
                  "This value does not exist.": "__STRING_NOT_TRANSLATED__",
                  "YouTube has more than {{count}} billion users.": "__STRING_NOT_TRANSLATED__",
                  "YouTube has more than {{count}} billion users._plural": "__STRING_NOT_TRANSLATED__",
                  "You have {{count}} messages.": "__STRING_NOT_TRANSLATED__",
                  "You have {{count}} messages._plural": "__STRING_NOT_TRANSLATED__"
                };
                t.same(found, wanted);
            }
        }))
        .on('end', function() {
            t.end();
        });
});

test('Empty result', function(t) {
    const options = _.merge({}, defaults, {
        func: {
            extensions: [] // without extensions
        }
    });

    gulp.src('test/fixtures/modules/**/*.js')
        .pipe(scanner(options))
        .pipe(tap(function(file) {
            const contents = file.contents.toString();
            const list = [
                'i18n/de/resource.json',
                'i18n/en/resource.json',
            ];

            if (_.includes(list, file.path)) {
                const found = JSON.parse(contents);
                const wanted = {};
                t.same(found, wanted);
            }
        }))
        .on('end', function() {
            t.end();
        });
});

test('Custom transform', function(t) {
    const options = _.merge({}, defaults, {
    });

    const expectedKey = 'CUSTOM TRANSFORM';
    const customTransform = function(file, enc, done) {
        this.parser.set(expectedKey);
        done();
    };

    gulp.src('test/fixtures/modules/**/*.js')
        .pipe(scanner(options, customTransform))
        .pipe(tap(function(file) {
            const contents = file.contents.toString();
            const list = [
                'i18n/de/resource.json',
                'i18n/en/resource.json',
            ];

            if (_.includes(list, file.path)) {
                const found = JSON.parse(contents);
                const wanted = {
                  "Loading...": "__STRING_NOT_TRANSLATED__",
                  "This value does not exist.": "__STRING_NOT_TRANSLATED__",
                  "YouTube has more than {{count}} billion users.": "__STRING_NOT_TRANSLATED__",
                  "YouTube has more than {{count}} billion users._plural": "__STRING_NOT_TRANSLATED__",
                  "You have {{count}} messages.": "__STRING_NOT_TRANSLATED__",
                  "You have {{count}} messages._plural": "__STRING_NOT_TRANSLATED__",
                  "CUSTOM TRANSFORM": "__STRING_NOT_TRANSLATED__"
                };
                t.same(found, wanted);
            }
        }))
        .on('end', function() {
            t.end();
        });
});

test('Custom flush', function(t) {
    const options = _.merge({}, defaults, {
    });

    const expectedContents = 'CUSTOM FLUSH';
    const customFlush = function(done) {
        this.push(new VirtualFile({
            path: 'virtual-path',
            contents: new Buffer(expectedContents)
        }));

        done();
    };

    gulp.src('test/fixtures/modules/**/*.js')
        .pipe(scanner(options, null, customFlush))
        .pipe(tap(function(file) {
            const contents = file.contents.toString();
            t.same(contents, expectedContents);
        }))
        .on('end', function() {
            t.end();
        });
});
