import type { Template } from "sanity";
import type { StructureResolver } from "sanity/structure";
import { PRODUCTS } from "./schemaTypes/fields";

/*
 * Sidebar = the site's URL folders, so where a page goes is obvious:
 *   /invoicing, /time-tracking, /time-tracking-and-invoicing  (product page, variants, audiences)
 *   /features, /alternatives, /compare, /guides
 */

const name = (product: { title: string }) => product.title.split(" (")[0];

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Pages by URL")
    .items([
      ...PRODUCTS.map((product) =>
        S.listItem()
          .id(product.value)
          .title(`/${product.value}`)
          .child(
            S.list()
              .title(name(product))
              .items([
                S.listItem()
                  .id(`${product.value}-page`)
                  .title(`/${product.value} · product page`)
                  .child(
                    S.documentList()
                      .title(`${name(product)} product page`)
                      .schemaType("productPage")
                      .filter('_type == "productPage" && product == $product')
                      .params({ product: product.value })
                      .initialValueTemplates([S.initialValueTemplateItem("productPage-by-product", { product: product.value })]),
                  ),
                S.listItem()
                  .id(`${product.value}-variants`)
                  .title(`/${product.value}/… · variants`)
                  .child(
                    S.documentList()
                      .title(`${name(product)} variants`)
                      .schemaType("variantPage")
                      .filter('_type == "variantPage" && product == $product')
                      .params({ product: product.value })
                      .initialValueTemplates([S.initialValueTemplateItem("variantPage-by-product", { product: product.value })]),
                  ),
                S.listItem()
                  .id(`${product.value}-audiences`)
                  .title(`/${product.value}/for/… · audiences`)
                  .child(
                    S.documentList()
                      .title(`${name(product)} for …`)
                      .schemaType("audiencePage")
                      .filter('_type == "audiencePage" && product == $product')
                      .params({ product: product.value })
                      .initialValueTemplates([S.initialValueTemplateItem("audiencePage-by-product", { product: product.value })]),
                  ),
              ]),
          ),
      ),
      S.divider(),
      S.documentTypeListItem("featurePage").title("/features/…"),
      S.documentTypeListItem("alternativePage").title("/alternatives/…"),
      S.documentTypeListItem("comparisonPage").title("/compare/…"),
      S.documentTypeListItem("guidePage").title("/guides/…"),
    ]);

/** "New page" inside a product folder starts with that product filled in. */
export const productTemplates: Template[] = ["productPage", "variantPage", "audiencePage"].map((schemaType) => ({
  id: `${schemaType}-by-product`,
  title: "Page for this product",
  schemaType,
  parameters: [{ name: "product", type: "string" }],
  value: (params: { product: string }) => ({ product: params.product }),
}));
