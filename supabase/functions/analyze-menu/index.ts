import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AnalyzeMenuRequest {
  scanId: string;
  userId: string;
  menuItems?: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { scanId, userId, menuItems }: AnalyzeMenuRequest =
      await req.json();

    if (!scanId || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const { data: goals } = await supabase
      .from('health_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    const { data: preferences } = await supabase
      .from('dietary_preferences')
      .select('*')
      .eq('user_id', userId);

    const activeGoal = goals && goals.length > 0 ? goals[0] : null;
    const dietaryRestrictions =
      preferences?.map((p) => p.preference_type) || [];

    const recommendations = generateRecommendations(
      menuItems || [],
      profile,
      activeGoal,
      dietaryRestrictions
    );

    const recommendationsToInsert = recommendations.map((rec) => ({
      scan_id: scanId,
      user_id: userId,
      ...rec,
    }));

    const { error: insertError } = await supabase
      .from('recommendations')
      .insert(recommendationsToInsert);

    if (insertError) throw insertError;

    await supabase
      .from('menu_scans')
      .update({ processing_status: 'completed' })
      .eq('id', scanId);

    return new Response(
      JSON.stringify({
        success: true,
        recommendations: recommendationsToInsert,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('Error processing menu:', error);

    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function generateRecommendations(
  menuItems: string[],
  profile: any,
  goal: any,
  dietaryRestrictions: string[]
): any[] {
  const sampleDishes = [
    {
      dish_name: 'Grilled Chicken Salad',
      description: 'Fresh mixed greens with grilled chicken breast, cherry tomatoes, and balsamic vinaigrette',
      estimated_calories: 350,
      protein_g: 42,
      carbs_g: 15,
      fat_g: 12,
    },
    {
      dish_name: 'Quinoa Power Bowl',
      description: 'Quinoa with roasted vegetables, chickpeas, and tahini dressing',
      estimated_calories: 420,
      protein_g: 18,
      carbs_g: 52,
      fat_g: 14,
    },
    {
      dish_name: 'Grilled Salmon with Steamed Broccoli',
      description: 'Wild-caught salmon fillet with steamed broccoli and lemon',
      estimated_calories: 380,
      protein_g: 38,
      carbs_g: 8,
      fat_g: 22,
    },
    {
      dish_name: 'Turkey and Avocado Wrap',
      description: 'Whole wheat wrap with lean turkey, avocado, and fresh vegetables',
      estimated_calories: 390,
      protein_g: 32,
      carbs_g: 35,
      fat_g: 15,
    },
  ];

  const recommendations = sampleDishes.map((dish, index) => {
    let reason = '';
    let healthScore = 85;

    if (goal?.goal_type === 'weight_loss') {
      if (dish.estimated_calories < 400) {
        reason = `Low in calories (${dish.estimated_calories} cal) - perfect for your weight loss goal. High in protein to keep you satisfied.`;
        healthScore = 95;
      } else {
        reason = `Moderate calories with good nutrient balance. Consider portion control for your weight loss goal.`;
        healthScore = 80;
      }
    } else if (goal?.goal_type === 'muscle_building') {
      if (dish.protein_g > 30) {
        reason = `Excellent protein content (${dish.protein_g}g) - ideal for muscle building. Supports recovery and growth.`;
        healthScore = 95;
      } else {
        reason = `Good protein source with balanced macros. Consider adding extra protein for optimal muscle building.`;
        healthScore = 82;
      }
    } else if (goal?.goal_type === 'health_management') {
      reason = 'Balanced nutritional profile with fresh, whole ingredients. Supports overall health and wellness.';
      healthScore = 88;
    } else {
      reason = 'Well-balanced meal with quality nutrients to maintain your current health.';
      healthScore = 85;
    }

    const proteinRatio = (dish.protein_g * 4) / dish.estimated_calories;
    if (proteinRatio > 0.35) {
      healthScore += 5;
    }

    return {
      ...dish,
      recommendation_reason: reason,
      health_score: Math.min(healthScore, 100),
    };
  });

  return recommendations.sort((a, b) => b.health_score - a.health_score);
}
