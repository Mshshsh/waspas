// src/pythonSnippets.js

export const pythonCodes = {
  setup: `

import pandas as pd
import numpy as np

# Alternatives
alternatives = ["Silver", "Gold", "Lead", "Rhodium", "Nickel", "Chromium", "Platinum"]

# Decision Matrix
data = [
    [350, 20, 4, 4, 2],
    [250, 25, 5, 3, 3],
    [150, 30, 3, 1, 1],
    [400, 20, 2, 3, 2],
    [550, 30, 1, 2, 1],
    [600, 35, 1, 5, 1],
    [580, 30, 4, 4, 3]
]

# Weights
weights = np.array([0.1761, 0.2042, 0.2668, 0.1243, 0.2286])

# Direction (1: Benefit, -1: Cost)
types = np.array([1, 1, 1, 1, -1])

df = pd.DataFrame(data, columns=["Hardness", "Thickness", "Aesthetic", "Adhesion", "Cost"], index=alternatives)
print(df)`,

  normalization: `

def normalize_matrix(df, criteria_types):
    norm_df = df.copy().astype(float)
    
    for col_idx, col_name in enumerate(df.columns):
        col_data = df[col_name]
        ctype = criteria_types[col_idx]
        
        # Benefit Criteria (Max)
        if ctype == 1: 
            max_val = col_data.max()
            norm_df[col_name] = col_data / max_val
            
        # Cost Criteria (Min)
        elif ctype == -1: 
            min_val = col_data.min()
            norm_df[col_name] = min_val / col_data
            
    return norm_df`,

  calculation: `

def calculate_waspas(norm_df, weights, lambda_val=0.5):
    Q1 = [] # WSM (Ağırlıklı Toplam)
    Q2 = [] # WPM (Ağırlıklı Çarpım)

    for i in range(len(norm_df)):
        row = norm_df.iloc[i].values
        
        # WSM: Sum(x_ij * w_j)
        wsm_val = np.sum(row * weights)
        Q1.append(wsm_val)
        
        # WPM: Product(x_ij ^ w_j)
        wpm_val = np.prod(np.power(row, weights))
        Q2.append(wpm_val)
    
    # Final Score
    results_df = pd.DataFrame(index=norm_df.index)
    results_df['Q_Final'] = (lambda_val * np.array(Q1)) + ((1 - lambda_val) * np.array(Q2))
    
    return results_df.sort_values(by='Q_Final', ascending=False)`
};