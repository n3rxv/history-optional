import * as migration_20260912_175956_initial from './20260912_175956_initial';
import * as migration_20260914_062752_add_content_hi from './20260914_062752_add_content_hi';

export const migrations = [
  {
    up: migration_20260912_175956_initial.up,
    down: migration_20260912_175956_initial.down,
    name: '20260912_175956_initial',
  },
  {
    up: migration_20260914_062752_add_content_hi.up,
    down: migration_20260914_062752_add_content_hi.down,
    name: '20260914_062752_add_content_hi'
  },
];
