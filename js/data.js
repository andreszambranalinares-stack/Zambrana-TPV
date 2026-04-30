export const defaultMenu = [
    // ENTRANTES
    { id: "e1", name: "Pan con tomate", desc: "", price: 2.50, category: "Entrantes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Pan", isEliminable: true, isAllergen: true }, // gluten implied if they want to eliminate it, but let's just flag allergen
          { name: "Tomate", isEliminable: true, isAllergen: false },
          { name: "Aceite", isEliminable: true, isAllergen: false },
          { name: "Ajo", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "e2", name: "Croquetas de jamón x6", desc: "", price: 7.00, category: "Entrantes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Jamón", isEliminable: true, isAllergen: false },
          { name: "Bechamel", isEliminable: true, isAllergen: true } // gluten, lactosa
      ]
    },
    { id: "e3", name: "Croquetas de bacalao x6", desc: "", price: 7.00, category: "Entrantes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Bacalao", isEliminable: true, isAllergen: true }, // pescado
          { name: "Bechamel", isEliminable: true, isAllergen: true } // gluten, lactosa
      ]
    },
    { id: "e4", name: "Gazpacho andaluz", desc: "", price: 4.00, category: "Entrantes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Tomate", isEliminable: true, isAllergen: false },
          { name: "Pepino", isEliminable: true, isAllergen: false },
          { name: "Pimiento verde", isEliminable: true, isAllergen: false },
          { name: "Cebolla", isEliminable: true, isAllergen: false },
          { name: "Ajo", isEliminable: true, isAllergen: false },
          { name: "Pan", isEliminable: true, isAllergen: true }
      ]
    },
    { id: "e5", name: "Ensaladilla rusa", desc: "", price: 6.00, category: "Entrantes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Patata", isEliminable: true, isAllergen: false },
          { name: "Zanahoria", isEliminable: true, isAllergen: false },
          { name: "Guisantes", isEliminable: true, isAllergen: false },
          { name: "Mayonesa", isEliminable: true, isAllergen: true },
          { name: "Atún", isEliminable: true, isAllergen: true },
          { name: "Huevo cocido", isEliminable: true, isAllergen: true }
      ]
    },
    { id: "e6", name: "Jamón ibérico", desc: "", price: 12.00, category: "Entrantes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: false, hasSinLactosa: false, hasSinSal: false, hasAlergiaLibre: false,
      ingredients: []
    },
    { id: "e7", name: "Tabla de quesos", desc: "", price: 10.00, category: "Entrantes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Queso manchego", isEliminable: true, isAllergen: true },
          { name: "Queso brie", isEliminable: true, isAllergen: true },
          { name: "Queso azul", isEliminable: true, isAllergen: true },
          { name: "Membrillo", isEliminable: true, isAllergen: false },
          { name: "Nueces", isEliminable: true, isAllergen: true }
      ]
    },
    { id: "e8", name: "Patatas bravas", desc: "", price: 5.00, category: "Entrantes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Patata", isEliminable: true, isAllergen: false },
          { name: "Salsa brava", isEliminable: true, isAllergen: false },
          { name: "Alioli", isEliminable: true, isAllergen: true } // huevo
      ]
    },
    { id: "e9", name: "Calamares a la romana", desc: "", price: 8.00, category: "Entrantes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Calamar", isEliminable: false, isAllergen: true },
          { name: "Rebozado", isEliminable: false, isAllergen: true }
      ]
    },
    { id: "e10", name: "Boquerones en vinagre", desc: "", price: 7.00, category: "Entrantes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Boquerones", isEliminable: true, isAllergen: true },
          { name: "Ajo", isEliminable: true, isAllergen: false },
          { name: "Perejil", isEliminable: true, isAllergen: false },
          { name: "Vinagre", isEliminable: true, isAllergen: false }
      ]
    },

    // ENSALADAS
    { id: "en1", name: "Ensalada mixta", desc: "", price: 5.50, category: "Entrantes", subcourse: "Ensaladas", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: false, hasSinLactosa: false, hasSinSal: false, hasAlergiaLibre: true,
      ingredients: [
          { name: "Lechuga", isEliminable: true, isAllergen: false },
          { name: "Tomate", isEliminable: true, isAllergen: false },
          { name: "Cebolla", isEliminable: true, isAllergen: false },
          { name: "Pepino", isEliminable: true, isAllergen: false },
          { name: "Aceitunas", isEliminable: true, isAllergen: false },
          { name: "Zanahoria", isEliminable: true, isAllergen: false },
          { name: "Atún", isEliminable: true, isAllergen: true },
          { name: "Huevo cocido", isEliminable: true, isAllergen: true }
      ]
    },
    { id: "en2", name: "Ensalada César", desc: "", price: 9.00, category: "Entrantes", subcourse: "Ensaladas", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: false, hasSinLactosa: false, hasSinSal: false, hasAlergiaLibre: true,
      ingredients: [
          { name: "Lechuga romana", isEliminable: true, isAllergen: false },
          { name: "Pollo a la plancha", isEliminable: true, isAllergen: false },
          { name: "Crutones", isEliminable: true, isAllergen: true },
          { name: "Parmesano", isEliminable: true, isAllergen: true },
          { name: "Anchoas", isEliminable: true, isAllergen: true },
          { name: "Salsa César", isEliminable: true, isAllergen: true }
      ]
    },
    { id: "en3", name: "Ensalada de queso de cabra", desc: "", price: 9.50, category: "Entrantes", subcourse: "Ensaladas", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: false, hasSinLactosa: false, hasSinSal: false, hasAlergiaLibre: true,
      ingredients: [
          { name: "Mezclum", isEliminable: true, isAllergen: false },
          { name: "Queso de cabra", isEliminable: true, isAllergen: true },
          { name: "Nueces", isEliminable: true, isAllergen: true },
          { name: "Tomate cherry", isEliminable: true, isAllergen: false },
          { name: "Cebolla morada", isEliminable: true, isAllergen: false },
          { name: "Vinagreta de miel", isEliminable: true, isAllergen: false }
      ]
    },

    // PRIMEROS PLATOS
    { id: "p1", name: "Sopa del día", desc: "", price: 5.00, category: "Entrantes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: []
    },
    { id: "p2", name: "Crema de calabaza", desc: "", price: 5.50, category: "Entrantes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Calabaza", isEliminable: true, isAllergen: false },
          { name: "Cebolla", isEliminable: true, isAllergen: false },
          { name: "Nata", isEliminable: true, isAllergen: true },
          { name: "Pipas de calabaza", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "p3", name: "Menestra de verduras", desc: "", price: 8.00, category: "Entrantes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Alcachofa", isEliminable: true, isAllergen: false },
          { name: "Judías verdes", isEliminable: true, isAllergen: false },
          { name: "Zanahoria", isEliminable: true, isAllergen: false },
          { name: "Guisantes", isEliminable: true, isAllergen: false },
          { name: "Espárragos", isEliminable: true, isAllergen: false },
          { name: "Jamón", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "p4", name: "Arroz con verduras", desc: "", price: 9.00, category: "Pastas", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Arroz", isEliminable: true, isAllergen: false },
          { name: "Pimiento rojo", isEliminable: true, isAllergen: false },
          { name: "Pimiento verde", isEliminable: true, isAllergen: false },
          { name: "Calabacín", isEliminable: true, isAllergen: false },
          { name: "Cebolla", isEliminable: true, isAllergen: false },
          { name: "Tomate", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "p5", name: "Arroz con bogavante", desc: "", price: 22.00, category: "Pastas", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Arroz", isEliminable: true, isAllergen: false },
          { name: "Bogavante", isEliminable: true, isAllergen: true },
          { name: "Tomate", isEliminable: true, isAllergen: false },
          { name: "Cebolla", isEliminable: true, isAllergen: false },
          { name: "Pimiento", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "p6", name: "Fideuá de marisco", desc: "", price: 16.00, category: "Pastas", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Fideos", isEliminable: true, isAllergen: true },
          { name: "Gamba", isEliminable: true, isAllergen: true },
          { name: "Mejillón", isEliminable: true, isAllergen: true },
          { name: "Calamar", isEliminable: true, isAllergen: true },
          { name: "Sofrito", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "p7", name: "Pasta carbonara", desc: "", price: 11.00, category: "Pastas", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Pasta", isEliminable: true, isAllergen: true },
          { name: "Bacon", isEliminable: true, isAllergen: false },
          { name: "Huevo", isEliminable: true, isAllergen: true },
          { name: "Parmesano", isEliminable: true, isAllergen: true },
          { name: "Nata", isEliminable: true, isAllergen: true },
          { name: "Pimienta negra", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "p8", name: "Pasta al pesto", desc: "", price: 10.00, category: "Pastas", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Pasta", isEliminable: true, isAllergen: true },
          { name: "Albahaca", isEliminable: true, isAllergen: false },
          { name: "Piñones", isEliminable: true, isAllergen: true },
          { name: "Parmesano", isEliminable: true, isAllergen: true },
          { name: "Ajo", isEliminable: true, isAllergen: false },
          { name: "Aceite", isEliminable: true, isAllergen: false }
      ]
    },

    // SEGUNDOS PLATOS
    { id: "s1", name: "Secreto ibérico a la brasa", desc: "", price: 14.00, category: "Carnes", subcourse: "", status: "Activo",
      hasPuntoCarne: true, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Secreto", isEliminable: true, isAllergen: false },
          { name: "Sal", isEliminable: true, isAllergen: false },
          { name: "Patatas fritas", isEliminable: true, isAllergen: false },
          { name: "Pimientos asados", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "s2", name: "Presa ibérica", desc: "", price: 16.00, category: "Carnes", subcourse: "", status: "Activo",
      hasPuntoCarne: true, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Presa", isEliminable: true, isAllergen: false },
          { name: "Sal", isEliminable: true, isAllergen: false },
          { name: "Patatas fritas", isEliminable: true, isAllergen: false },
          { name: "Chimichurri", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "s3", name: "Solomillo al roquefort", desc: "", price: 19.00, category: "Carnes", subcourse: "", status: "Activo",
      hasPuntoCarne: true, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Solomillo", isEliminable: true, isAllergen: false },
          { name: "Salsa roquefort", isEliminable: true, isAllergen: true },
          { name: "Patatas fritas", isEliminable: true, isAllergen: false },
          { name: "Pimientos", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "s4", name: "Solomillo a la pimienta", desc: "", price: 19.00, category: "Carnes", subcourse: "", status: "Activo",
      hasPuntoCarne: true, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Solomillo", isEliminable: true, isAllergen: false },
          { name: "Salsa pimienta", isEliminable: true, isAllergen: true },
          { name: "Patatas fritas", isEliminable: true, isAllergen: false },
          { name: "Cebolla", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "s5", name: "Chuletón de ternera", desc: "", price: 24.00, category: "Carnes", subcourse: "", status: "Activo",
      hasPuntoCarne: true, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Chuletón", isEliminable: true, isAllergen: false },
          { name: "Sal gruesa", isEliminable: true, isAllergen: false },
          { name: "Patatas", isEliminable: true, isAllergen: false },
          { name: "Pimientos del padrón", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "s6", name: "Carrillada en salsa", desc: "", price: 15.00, category: "Carnes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Carrillada", isEliminable: true, isAllergen: false },
          { name: "Salsa de vino tinto", isEliminable: true, isAllergen: false },
          { name: "Puré de patata", isEliminable: true, isAllergen: true }, // lactosa possibly
          { name: "Zanahoria", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "s7", name: "Pollo al ajillo", desc: "", price: 11.00, category: "Carnes", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Pollo", isEliminable: true, isAllergen: false },
          { name: "Ajo", isEliminable: true, isAllergen: false },
          { name: "Vino blanco", isEliminable: true, isAllergen: false },
          { name: "Perejil", isEliminable: true, isAllergen: false },
          { name: "Patatas", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "s8", name: "Merluza a la plancha", desc: "", price: 13.00, category: "Pescados", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Merluza", isEliminable: true, isAllergen: true },
          { name: "Limón", isEliminable: true, isAllergen: false },
          { name: "Ajo", isEliminable: true, isAllergen: false },
          { name: "Perejil", isEliminable: true, isAllergen: false },
          { name: "Patatas", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "s9", name: "Lubina al horno", desc: "", price: 18.00, category: "Pescados", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Lubina", isEliminable: true, isAllergen: true },
          { name: "Patatas panaderas", isEliminable: true, isAllergen: false },
          { name: "Limón", isEliminable: true, isAllergen: false },
          { name: "Ajo", isEliminable: true, isAllergen: false },
          { name: "Vino blanco", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "s10", name: "Bacalao al pil-pil", desc: "", price: 17.00, category: "Pescados", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Bacalao", isEliminable: true, isAllergen: true },
          { name: "Aceite", isEliminable: true, isAllergen: false },
          { name: "Ajo", isEliminable: true, isAllergen: false },
          { name: "Guindilla", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "s11", name: "Gambas al ajillo", desc: "", price: 14.00, category: "Pescados", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Gambas", isEliminable: true, isAllergen: true },
          { name: "Ajo", isEliminable: true, isAllergen: false },
          { name: "Guindilla", isEliminable: true, isAllergen: false },
          { name: "Aceite", isEliminable: true, isAllergen: false },
          { name: "Pan", isEliminable: true, isAllergen: true }
      ]
    },
    { id: "s12", name: "Dorada a la sal", desc: "", price: 16.00, category: "Pescados", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: true, hasSinLactosa: true, hasSinSal: true, hasAlergiaLibre: true,
      ingredients: [
          { name: "Dorada", isEliminable: true, isAllergen: true },
          { name: "Sal gruesa", isEliminable: true, isAllergen: false },
          { name: "Limón", isEliminable: true, isAllergen: false }
      ]
    },

    // POSTRES
    { id: "d1", name: "Flan casero", desc: "", price: 3.50, category: "Postres", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: false, hasSinLactosa: false, hasSinSal: false, hasAlergiaLibre: true,
      ingredients: [
          { name: "Flan", isEliminable: true, isAllergen: true }, // huevo, lactosa
          { name: "Caramelo", isEliminable: true, isAllergen: false },
          { name: "Nata", isEliminable: true, isAllergen: true }
      ]
    },
    { id: "d2", name: "Tarta de queso", desc: "", price: 4.00, category: "Postres", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: false, hasSinLactosa: false, hasSinSal: false, hasAlergiaLibre: true,
      ingredients: [
          { name: "Queso crema", isEliminable: true, isAllergen: true },
          { name: "Galleta", isEliminable: true, isAllergen: true },
          { name: "Mermelada de frutos rojos", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "d3", name: "Brownie con helado", desc: "", price: 4.50, category: "Postres", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: false, hasSinLactosa: false, hasSinSal: false, hasAlergiaLibre: true,
      ingredients: [
          { name: "Brownie", isEliminable: true, isAllergen: true }, // gluten, huevo
          { name: "Helado vainilla", isEliminable: true, isAllergen: true }, // lactosa
          { name: "Sirope chocolate", isEliminable: true, isAllergen: false },
          { name: "Nueces", isEliminable: true, isAllergen: true }
      ]
    },
    { id: "d4", name: "Helado de temporada", desc: "", price: 3.00, category: "Postres", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: false, hasSinLactosa: false, hasSinSal: false, hasAlergiaLibre: true,
      ingredients: []
    },
    { id: "d5", name: "Torrija de brioche", desc: "", price: 4.00, category: "Postres", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: false, hasSinLactosa: false, hasSinSal: false, hasAlergiaLibre: true,
      ingredients: [
          { name: "Brioche", isEliminable: true, isAllergen: true },
          { name: "Leche", isEliminable: true, isAllergen: true },
          { name: "Canela", isEliminable: true, isAllergen: false },
          { name: "Azúcar", isEliminable: true, isAllergen: false },
          { name: "Helado", isEliminable: true, isAllergen: true }
      ]
    },
    { id: "d6", name: "Natillas caseras", desc: "", price: 3.50, category: "Postres", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: false, hasSinLactosa: false, hasSinSal: false, hasAlergiaLibre: true,
      ingredients: [
          { name: "Natillas", isEliminable: true, isAllergen: true },
          { name: "Galleta", isEliminable: true, isAllergen: true },
          { name: "Canela", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "d7", name: "Macedonia de frutas", desc: "", price: 3.00, category: "Postres", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: false, hasSinLactosa: false, hasSinSal: false, hasAlergiaLibre: true,
      ingredients: [
          { name: "Naranja", isEliminable: true, isAllergen: false },
          { name: "Manzana", isEliminable: true, isAllergen: false },
          { name: "Kiwi", isEliminable: true, isAllergen: false },
          { name: "Plátano", isEliminable: true, isAllergen: false },
          { name: "Fresa", isEliminable: true, isAllergen: false },
          { name: "Zumo naranja", isEliminable: true, isAllergen: false }
      ]
    },
    { id: "d8", name: "Crema catalana", desc: "", price: 4.00, category: "Postres", subcourse: "", status: "Activo",
      hasPuntoCarne: false, hasSinGluten: false, hasSinLactosa: false, hasSinSal: false, hasAlergiaLibre: true,
      ingredients: [
          { name: "Crema", isEliminable: true, isAllergen: true },
          { name: "Azúcar", isEliminable: true, isAllergen: false },
          { name: "Canela", isEliminable: true, isAllergen: false }
      ]
    },

    // BEBIDAS
    { id: "b1", name: "Agua 50cl", desc: "", price: 1.50, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b2", name: "Agua 1L", desc: "", price: 2.00, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b3", name: "Agua con gas 50cl", desc: "", price: 1.80, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b4", name: "Refresco lata", desc: "", price: 2.50, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b5", name: "Zumo natural", desc: "", price: 3.00, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b6", name: "Cerveza caña", desc: "", price: 2.80, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b7", name: "Cerveza botellín", desc: "", price: 3.00, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b8", name: "Cerveza sin alcohol", desc: "", price: 2.80, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b9", name: "Vino blanco copa", desc: "", price: 2.50, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b10", name: "Vino tinto copa", desc: "", price: 2.50, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b11", name: "Vino rosado copa", desc: "", price: 2.50, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b12", name: "Botella vino blanco casa", desc: "", price: 9.00, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b13", name: "Botella vino tinto casa", desc: "", price: 9.00, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b14", name: "Botella vino blanco carta", desc: "", price: 14.00, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b15", name: "Botella vino tinto carta", desc: "", price: 14.00, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b16", name: "Manzanilla copa", desc: "", price: 2.50, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b17", name: "Manzanilla botella", desc: "", price: 8.00, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b18", name: "Sangría jarra", desc: "", price: 7.00, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b19", name: "Tinto de verano", desc: "", price: 2.80, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b20", name: "Café solo", desc: "", price: 1.50, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b21", name: "Cortado", desc: "", price: 1.80, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b22", name: "Café con leche", desc: "", price: 2.00, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b23", name: "Cappuccino", desc: "", price: 2.50, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b24", name: "Té / Infusión", desc: "", price: 1.80, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b25", name: "Copa de cava", desc: "", price: 3.50, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] },
    { id: "b26", name: "Copa de brandy", desc: "", price: 3.00, category: "Bebidas", subcourse: "", status: "Activo", ingredients: [] }
];

// Helper to determine destination based on category
export function getCategoryDestination(category) {
    const destMap = {
        "Entrantes": "cocina",
        "Carnes": "cocina",
        "Pescados": "cocina",
        "Pastas": "cocina",
        "Ensalada": "cocina",
                "Postres": "barra",
        "Bebidas": "barra",
        "Extra cocina": "cocina",
        "Extra barra": "barra"
    };
    return destMap[category] || "cocina";
}
