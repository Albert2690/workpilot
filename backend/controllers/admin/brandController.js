import CarBrand from "../../models/CarBrand.js";

/*
|--------------------------------------------------------------------------
| CREATE BRAND
|--------------------------------------------------------------------------
*/

export const createBrand = async (req, res) => {
  try {

    const { brandName, brands } = req.body;
    console.log("body", req.body);


    // ======================
    // SINGLE BRAND CREATE
    // ======================

    if (brandName) {

      const trimmedBrand = brandName.trim();

      const existingBrand = await CarBrand.findOne({
        brandName: {
          $regex: new RegExp(`^${trimmedBrand}$`, "i"),
        },
      });

      if (existingBrand) {
        return res.status(400).json({
          success: false,
          message: "Brand already exists",
        });
      }

      const brand = await CarBrand.create({
        brandName: trimmedBrand,
      });

      return res.status(201).json({
        success: true,
        message: "Brand created successfully",
        brand,
      });
    }

    // ======================
    // BULK BRAND CREATE
    // ======================

    if (brands && Array.isArray(brands)) {

      // remove empty values + trim spaces
      const cleanedBrands = brands
        .map(item => item.trim())
        .filter(item => item);

      // find existing brands
      const existingBrands = await CarBrand.find({
        brandName: {
          $in: cleanedBrands,
        },
      });

      const existingNames = existingBrands.map(
        item => item.brandName.toLowerCase()
      );

      // remove duplicates
      const newBrands = cleanedBrands
        .filter(
          item => !existingNames.includes(item.toLowerCase())
        )
        .map(item => ({
          brandName: item,
        }));

      // if all already exist
      if (newBrands.length === 0) {
        return res.status(400).json({
          success: false,
          message: "All brands already exist",
        });
      }

      const insertedBrands = await CarBrand.insertMany(
        newBrands
      );

      return res.status(201).json({
        success: true,
        message: `${insertedBrands.length} brands created successfully`,
        brands: insertedBrands,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Please provide brandName or brands array",
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/*
|--------------------------------------------------------------------------
| GET BRANDS
|--------------------------------------------------------------------------
*/

export const getBrands = async (req, res) => {
  try {
    const brands = await CarBrand.find().sort({
      brandName: 1,
    });

    res.status(200).json({
      success: true,
      brands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};