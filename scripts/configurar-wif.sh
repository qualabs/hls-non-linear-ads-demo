#!/usr/bin/env bash
# configurar-wif.sh -- the GCP side of .github/workflows/publicar.yml: GitHub
# Actions publishes the demos without any key. Idempotent: what exists is left as
# it is, and the run always ends with the verification, which is all it does on a
# second run. Needs an account with Owner on the project.
#
#   - sts.googleapis.com, which WIF needs for the token exchange.
#   - Pool `github` and OIDC provider `hls-non-linear-ads-demo`, accepting only
#     this repository (by name AND by id, so a deleted and recreated repo with the
#     same name does not inherit the access) on refs/heads/main.
#   - Service account `hls-demo-publisher`, with roles/storage.objectAdmin on the
#     five demo buckets only, at bucket level. Nothing at project level, and never
#     a JSON key: the verification fails if one exists.
#   - The principals of that repository may impersonate it.
#
# A change to the condition of an existing provider is not applied by this script:
# it says so and goes red, because it widens or narrows who can publish.
set -euo pipefail

PROJECT=cto-assistant-501315
NUMBER=238909009692
POOL=github PROVIDER=hls-non-linear-ads-demo
REPO=qualabs/hls-non-linear-ads-demo REPO_ID=1354922930
SA=hls-demo-publisher@$PROJECT.iam.gserviceaccount.com
DEMOS=(stage-pair race-multiview multiview-offer hydration-break compatibility-pair)
CONDITION="assertion.repository == '$REPO' && assertion.repository_id == '$REPO_ID' && assertion.ref == 'refs/heads/main'"
MEMBER="principalSet://iam.googleapis.com/projects/$NUMBER/locations/global/workloadIdentityPools/$POOL/attribute.repository/$REPO"
g() { gcloud --project="$PROJECT" --quiet "$@"; }

echo "== 1. apply =="
g services enable sts.googleapis.com iamcredentials.googleapis.com
g iam workload-identity-pools describe "$POOL" --location=global >/dev/null 2>&1 ||
  g iam workload-identity-pools create "$POOL" --location=global --display-name="GitHub Actions"
g iam workload-identity-pools providers describe "$PROVIDER" --location=global --workload-identity-pool="$POOL" >/dev/null 2>&1 ||
  g iam workload-identity-pools providers create-oidc "$PROVIDER" --location=global --workload-identity-pool="$POOL" \
    --display-name="$REPO main" --issuer-uri=https://token.actions.githubusercontent.com \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.repository_id=assertion.repository_id,attribute.ref=assertion.ref" \
    --attribute-condition="$CONDITION"
g iam service-accounts describe "$SA" >/dev/null 2>&1 ||
  g iam service-accounts create "${SA%%@*}" --display-name="hls-non-linear-ads-demo publisher" \
    --description="Publishes the demos from GitHub Actions through WIF. objectAdmin on the five demo buckets only."
for d in "${DEMOS[@]}"; do
  g storage buckets add-iam-policy-binding "gs://qualabs-hls-demo-$d" --member="serviceAccount:$SA" \
    --role=roles/storage.objectAdmin >/dev/null
done
g iam service-accounts add-iam-policy-binding "$SA" --role=roles/iam.workloadIdentityUser --member="$MEMBER" >/dev/null

echo "== 2. verify =="
red=0
g iam workload-identity-pools describe "$POOL" --location=global --format='yaml(name,state,disabled)'
got=$(g iam workload-identity-pools providers describe "$PROVIDER" --location=global --workload-identity-pool="$POOL" \
  --format='value(attributeCondition)')
g iam workload-identity-pools providers describe "$PROVIDER" --location=global --workload-identity-pool="$POOL" \
  --format='yaml(name,state,oidc.issuerUri,attributeMapping,attributeCondition)'
[ "$got" = "$CONDITION" ] || { echo "   RED: the provider's condition is not the one this script declares"; red=1; }
echo "-- who may impersonate $SA:"
g iam service-accounts get-iam-policy "$SA" --format=json | python3 -c '
import json, sys; b = json.load(sys.stdin).get("bindings", [])
for x in b: print("  ", x["role"], x["members"])
sys.exit(0 if b == [{"role": "roles/iam.workloadIdentityUser", "members": [sys.argv[1]]}] else 1)' "$MEMBER" || red=1
echo "-- the SA on each bucket:"
for d in "${DEMOS[@]}"; do
  roles=$(g storage buckets get-iam-policy "gs://qualabs-hls-demo-$d" --format=json | python3 -c '
import json, sys; print(" ".join(x["role"] for x in json.load(sys.stdin)["bindings"] if "serviceAccount:'"$SA"'" in x["members"]))')
  printf '   %-40s %s\n' "qualabs-hls-demo-$d" "${roles:-NONE}"
  [ "$roles" = roles/storage.objectAdmin ] || red=1
done
proj=$(g projects get-iam-policy "$PROJECT" --flatten=bindings --filter="bindings.members:serviceAccount:$SA" --format='value(bindings.role)')
echo "-- the SA at project level: ${proj:-nothing}"
[ -z "$proj" ] || red=1
keys=$(g iam service-accounts keys list --iam-account="$SA" --managed-by=user --format='value(name)')
echo "-- user-managed keys of the SA: ${keys:-none}"
[ -z "$keys" ] || red=1
if [ "$red" = 0 ]; then echo GREEN; else echo RED; exit 1; fi
