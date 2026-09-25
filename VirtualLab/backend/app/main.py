from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np

try:
    from app.routers import linear_regression, ml_tools
except ModuleNotFoundError:
    from routers import linear_regression, ml_tools

app = FastAPI(
    title="Virtual Lab API",
    description="Backend for DAA, OOPM and ML Virtual Labs",
    version="1.0.0"
)

# Enable CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(linear_regression.router)
app.include_router(ml_tools.router)


class PcaSimulationRequest(BaseModel):
    samples: int = 140
    correlation: float = 0.8
    noise: float = 0.4
    rotation_deg: float = 35.0
    standardize: bool = True
    n_components: int = 2
    preset: str = "gaussian"  # gaussian, clusters, s_curve, parkinsons
    seed: int = 42


@app.get("/")
def root():
    return {
        "message": "KJSIT Virtual Lab API is running",
        "endpoints": [
            "/api/ml/tools/benchmark",
            "/api/ml/tools/nba-data",
            "/api/simulation/pca"
        ]
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }


@app.post("/api/simulation/pca")
def compute_pca_simulation(req: PcaSimulationRequest):
    rng = np.random.RandomState(req.seed)
    n = max(20, min(req.samples, 600))
    
    z0 = rng.randn(n)
    z1 = rng.randn(n)

    # 1. Generate synthetic dataset based on preset
    if req.preset == "clusters":
        n_half = n // 2
        c1 = np.column_stack([z0[:n_half] * 0.8 - 2.5, z1[:n_half] * (0.3 + req.noise * 0.4) - 1.5])
        c2 = np.column_stack([z0[n_half:] * 0.8 + 2.5, z1[n_half:] * (0.3 + req.noise * 0.4) + 1.5])
        X = np.vstack([c1, c2])
    elif req.preset == "s_curve":
        t = np.linspace(-1.5 * np.pi, 1.5 * np.pi, n)
        x = np.sin(t) * 3 + z0 * (req.noise * 0.5)
        y = t * 1.4 + z1 * (req.noise * 0.5)
        X = np.column_stack([x, y])
    elif req.preset == "parkinsons":
        base_signal = z0 * 2.2
        f1 = base_signal + z1 * (req.noise * 0.9)
        f2 = 0.7 * base_signal + rng.randn(n) * (req.noise * 0.6)
        X = np.column_stack([f1, f2])
    else:
        corr = np.clip(req.correlation, -0.99, 0.99)
        x = z0 * 2.5
        y = (corr * z0 + np.sqrt(1.0 - corr**2) * z1) * (1.0 + req.noise)
        X = np.column_stack([x, y])

    # Apply rotation angle
    rad = np.radians(req.rotation_deg)
    rot_matrix = np.array([[np.cos(rad), -np.sin(rad)], [np.sin(rad), np.cos(rad)]])
    X = X @ rot_matrix.T

    # 2. Compute Mean & Centering / Standardization
    mean_vec = np.mean(X, axis=0)
    X_centered = X - mean_vec
    
    std_vec = np.std(X_centered, axis=0)
    std_vec[std_vec == 0] = 1.0
    
    if req.standardize:
        X_processed = X_centered / std_vec
    else:
        X_processed = X_centered

    # 3. Covariance Matrix & Eigen Decomposition
    cov_matrix = np.cov(X_processed, rowvar=False)
    cov_matrix = np.atleast_2d(cov_matrix)
    eigenvalues, eigenvectors = np.linalg.eigh(cov_matrix)

    sort_idx = np.argsort(eigenvalues)[::-1]
    eigenvalues = np.maximum(eigenvalues[sort_idx], 0.0)
    eigenvectors = eigenvectors[:, sort_idx]

    total_var = np.sum(eigenvalues)
    if total_var > 0:
        explained_var_ratio = (eigenvalues / total_var).tolist()
    else:
        explained_var_ratio = [0.5, 0.5]

    # 4. Project onto Principal Components
    projected = X_processed @ eigenvectors
    
    return {
        "status": "success",
        "sample_count": n,
        "mean": mean_vec.round(4).tolist(),
        "std": std_vec.round(4).tolist(),
        "covariance_matrix": cov_matrix.round(4).tolist(),
        "eigenvalues": eigenvalues.round(4).tolist(),
        "eigenvectors": [
            {
                "name": "PC1",
                "vector": eigenvectors[:, 0].round(4).tolist(),
                "variance_explained": round(explained_var_ratio[0] * 100, 2),
                "eigenvalue": round(float(eigenvalues[0]), 4),
            },
            {
                "name": "PC2",
                "vector": eigenvectors[:, 1].round(4).tolist(),
                "variance_explained": round(explained_var_ratio[1] * 100, 2),
                "eigenvalue": round(float(eigenvalues[1]), 4),
            }
        ],
        "total_variance_explained": round(sum(explained_var_ratio[:req.n_components]) * 100, 2),
        "original_data": X.round(3).tolist(),
        "centered_data": X_processed.round(3).tolist(),
        "projected_data": projected.round(3).tolist(),
    }