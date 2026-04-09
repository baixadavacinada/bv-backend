import { Request, Response } from "express";
import { UserModel } from "../../../infrastructure/database/models/userModel";

export async function createUserController(req: Request, res: Response) {
  try {
    const user = new UserModel(req.body);
    const saved = await user.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro ao criar usuário" });
  }
}

/**
 * Toggle favorite educational material for a user
 */
export async function toggleFavoriteEducationalMaterialController(
  req: Request,
  res: Response
) {
  try {
    const { userId } = req.params;
    const { materialId } = req.body;

    if (!userId || !materialId) {
      return res.status(400).json({
        error: "userId and materialId are required",
      });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Initialize profile if it doesn't exist
    if (!user.profile) {
      user.profile = {};
    }

    // Initialize favoriteEducationalMaterials if it doesn't exist
    if (!user.profile.favoriteEducationalMaterials) {
      user.profile.favoriteEducationalMaterials = [];
    }

    // Check if material is already favorited
    const materialIndex = user.profile.favoriteEducationalMaterials.findIndex(
      (item) => item.materialId === materialId
    );

    if (materialIndex > -1) {
      // Remove from favorites
      user.profile.favoriteEducationalMaterials.splice(materialIndex, 1);
    } else {
      // Add to favorites
      user.profile.favoriteEducationalMaterials.push({
        materialId,
        addedAt: new Date(),
      });
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      message: "Material educativo favorito atualizado com sucesso",
      favoriteEducationalMaterials:
        updatedUser.profile?.favoriteEducationalMaterials,
    });
  } catch (error) {
    console.error("Erro ao atualizar material favorito:", error);
    return res.status(500).json({
      error: "Erro ao atualizar material educativo favorito",
    });
  }
}

/**
 * Get user's favorite educational materials
 */
export async function getUserFavoriteEducationalMaterialsController(
  req: Request,
  res: Response
) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const user = await UserModel.findById(userId).select(
      "profile.favoriteEducationalMaterials"
    );

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const favorites = user.profile?.favoriteEducationalMaterials || [];

    return res.status(200).json({
      favoriteEducationalMaterials: favorites,
    });
  } catch (error) {
    console.error("Erro ao obter materiais favoritos:", error);
    return res.status(500).json({
      error: "Erro ao obter materiais educativos favoritos",
    });
  }
}

/**
 * Get eligible users for template testing (users with phone and WhatsApp acceptance)
 */
export async function getEligibleUsersForTestController(
  req: Request,
  res: Response
) {
  try {
    const users = await UserModel.find(
      {
        "phone": { $exists: true, $nin: [null, ""] },
        "preferences.acceptWhatsAppNotifications": true,
        "isActive": true
      },
      { 
        _id: 1, 
        name: 1, 
        email: 1, 
        phone: 1 
      }
    ).limit(100);

    const formattedUsers = users.map(user => ({
      id: user._id?.toString(),
      name: user.name || 'Sem nome',
      email: user.email || '',
      phone: user.phone || ''
    }));

    return res.status(200).json({
      success: true,
      data: {
        users: formattedUsers
      }
    });
  } catch (error) {
    console.error("Erro ao buscar usuários elegíveis:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar usuários elegíveis para teste"
    });
  }
}
