import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    entry: {
      "*": "./src/exports/*",
    },
    dts: {
      tsgo: true,
    },
    exports: {
      devExports: true,
    },
  },
  lint: {
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {},
});
