/**
 * Makes three.js bump mapping NaN-safe. On a pixel whose screen-space
 * derivatives vanish (a sliver or edge-on triangle) `perturbNormalArb`
 * normalizes a zero vector and returns NaN; the bloom pass then spreads that
 * single NaN over the whole frame and the picture turns black. Such pixels
 * keep their unperturbed normal instead. Imported once before any material
 * compiles.
 */
import * as THREE from 'three';

const SIGMA = /vec3 vSigmaX = normalize\( dFdx\( surf_pos\.xyz \) \);\s*vec3 vSigmaY = normalize\( dFdy\( surf_pos\.xyz \) \);/;
const SAFE_SIGMA = `vec3 dPdx = dFdx( surf_pos.xyz );
		vec3 dPdy = dFdy( surf_pos.xyz );
		if ( dot( dPdx, dPdx ) < 1e-14 || dot( dPdy, dPdy ) < 1e-14 ) return surf_norm;
		vec3 vSigmaX = normalize( dPdx );
		vec3 vSigmaY = normalize( dPdy );`;
const RESULT = /return normalize\( abs\( fDet \) \* surf_norm - vGrad \);/;
const SAFE_RESULT = `vec3 perturbed = abs( fDet ) * surf_norm - vGrad;
		return dot( perturbed, perturbed ) > 1e-12 ? normalize( perturbed ) : surf_norm;`;

const chunk = THREE.ShaderChunk.bumpmap_pars_fragment;
if (SIGMA.test(chunk) && RESULT.test(chunk)) {
  THREE.ShaderChunk.bumpmap_pars_fragment = chunk.replace(SIGMA, SAFE_SIGMA).replace(RESULT, SAFE_RESULT);
} else if (import.meta.env.DEV) {
  console.warn('shaderFixes: the bump map chunk changed in this three.js version; the NaN guard is not applied');
}
