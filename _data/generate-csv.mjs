import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(fs.readFileSync(join(__dirname, "products.json"), "utf8"));

const sizes = data.sizes_all;
const products = data.products;

const headers = [
  "Handle","Title","Body (HTML)","Vendor","Product Category","Type","Tags",
  "Published","Option1 Name","Option1 Value","Option2 Name","Option2 Value",
  "Variant SKU","Variant Grams","Variant Inventory Tracker","Variant Inventory Qty",
  "Variant Inventory Policy","Variant Fulfillment Service","Variant Price",
  "Variant Compare At Price","Variant Requires Shipping","Variant Taxable",
  "Image Src","Image Position","Image Alt Text",
  "SEO Title","SEO Description","Status"
];

function csvEscape(val) {
  if (val === undefined || val === null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const rows = [headers.map(csvEscape).join(",")];

for (const product of products) {
  const handle = product.model.toLowerCase().replace(/\s+/g, "-");
  const title = product.model;
  const body = "<p>" + product.description + "</p>";
  const vendor = "Sania D'Mina";
  const tags = [product.category, product.type].join(", ");

  let isFirstRowOfProduct = true;

  for (const variant of product.variants) {
    const color = variant.color;
    const price = variant.price_sek;
    const images = variant.images || [];
    let isFirstRowOfColor = true;

    for (let sIdx = 0; sIdx < sizes.length; sIdx++) {
      const size = sizes[sIdx];
      const colorSlug = color.toLowerCase().replace(/\s+/g, "-");
      const sizeSlug = size.replace(".", "");
      const sku = handle.toUpperCase().replace(/-/g, "") + "-" + colorSlug.toUpperCase().replace(/-/g, "") + "-" + sizeSlug;

      const row = {};
      for (const h of headers) row[h] = "";

      row["Handle"] = handle;

      if (isFirstRowOfProduct) {
        row["Title"] = title;
        row["Body (HTML)"] = body;
        row["Vendor"] = vendor;
        row["Type"] = product.type;
        row["Tags"] = tags;
        row["Published"] = "TRUE";
        row["SEO Title"] = title + " | Sania D'Mina";
        row["SEO Description"] = product.description;
        row["Status"] = "active";
      }

      row["Option1 Name"] = "Color";
      row["Option1 Value"] = color;
      row["Option2 Name"] = "Size";
      row["Option2 Value"] = size;
      row["Variant SKU"] = sku;
      row["Variant Grams"] = "0";
      row["Variant Inventory Tracker"] = "shopify";
      row["Variant Inventory Qty"] = "10";
      row["Variant Inventory Policy"] = "deny";
      row["Variant Fulfillment Service"] = "manual";
      row["Variant Price"] = String(price);
      row["Variant Requires Shipping"] = "TRUE";
      row["Variant Taxable"] = "TRUE";

      if (isFirstRowOfColor && images.length > 0) {
        row["Image Src"] = images[0];
        row["Image Position"] = "1";
        row["Image Alt Text"] = color;
      }

      rows.push(headers.map(h => csvEscape(row[h])).join(","));

      // After the first size row of a color variant, add additional image rows
      if (isFirstRowOfColor && images.length > 1) {
        for (let imgIdx = 1; imgIdx < images.length; imgIdx++) {
          const imgRow = {};
          for (const h of headers) imgRow[h] = "";
          imgRow["Handle"] = handle;
          imgRow["Image Src"] = images[imgIdx];
          imgRow["Image Position"] = String(imgIdx + 1);
          imgRow["Image Alt Text"] = color;
          rows.push(headers.map(h => csvEscape(imgRow[h])).join(","));
        }
      }

      isFirstRowOfProduct = false;
      isFirstRowOfColor = false;
    }
  }
}

const outPath = join(__dirname, "shopify-import.csv");
fs.writeFileSync(outPath, rows.join("\n") + "\n", "utf8");
console.log("CSV written to", outPath);
console.log("Total rows (including header):", rows.length);
