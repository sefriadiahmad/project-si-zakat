export function hitungZakat(input = {}) {
  const { jumlah_jiwa, harga_beras_per_kg, nilai_harta, nilai_nisab } = input

  const J = Number(jumlah_jiwa)
  const H = Number(harga_beras_per_kg)
  const A = Number(nilai_harta)
  const N = Number(nilai_nisab)

  if (J < 1 || H < 0 || A < 0 || N < 0) {
    return {
      zakat_fitrah_uang: 0,
      zakat_fitrah_beras: 0,
      zakat_mal: 0,
    }
  }

  const zakat_fitrah_uang = J * H * 2.5
  const zakat_fitrah_beras = J * 2.5
  const zakat_mal = Math.max(0, A - N) * 0.025

  return {
    zakat_fitrah_uang: Number(zakat_fitrah_uang.toFixed(2)),
    zakat_fitrah_beras: Number(zakat_fitrah_beras.toFixed(3)),
    zakat_mal: Number(zakat_mal.toFixed(2)),
  }
}
