import * as migration_20260905_023242_initial_unipress_schema from './20260905_023242_initial_unipress_schema';
import * as migration_20260905_024132_add_global_drafts from './20260905_024132_add_global_drafts';
import * as migration_20260906_000452_editable_navigation from './20260906_000452_editable_navigation';
import * as migration_20260906_054159_area_cliente_certificados from './20260906_054159_area_cliente_certificados';
import * as migration_20260907_162624_editorial_images from './20260907_162624_editorial_images';
import * as migration_20260907_170407_editable_hero_proofs from './20260907_170407_editable_hero_proofs';
import * as migration_20260907_174649_separate_header_footer_logos from './20260907_174649_separate_header_footer_logos';

export const migrations = [
  {
    up: migration_20260905_023242_initial_unipress_schema.up,
    down: migration_20260905_023242_initial_unipress_schema.down,
    name: '20260905_023242_initial_unipress_schema',
  },
  {
    up: migration_20260905_024132_add_global_drafts.up,
    down: migration_20260905_024132_add_global_drafts.down,
    name: '20260905_024132_add_global_drafts',
  },
  {
    up: migration_20260906_000452_editable_navigation.up,
    down: migration_20260906_000452_editable_navigation.down,
    name: '20260906_000452_editable_navigation',
  },
  {
    up: migration_20260906_054159_area_cliente_certificados.up,
    down: migration_20260906_054159_area_cliente_certificados.down,
    name: '20260906_054159_area_cliente_certificados',
  },
  {
    up: migration_20260907_162624_editorial_images.up,
    down: migration_20260907_162624_editorial_images.down,
    name: '20260907_162624_editorial_images',
  },
  {
    up: migration_20260907_170407_editable_hero_proofs.up,
    down: migration_20260907_170407_editable_hero_proofs.down,
    name: '20260907_170407_editable_hero_proofs',
  },
  {
    up: migration_20260907_174649_separate_header_footer_logos.up,
    down: migration_20260907_174649_separate_header_footer_logos.down,
    name: '20260907_174649_separate_header_footer_logos'
  },
];
