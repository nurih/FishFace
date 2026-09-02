from pathlib import Path
import random
import time
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

urls = [
"https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/20160530_-_Arothron_nigropunctatus_-_1.jpg/250px-20160530_-_Arothron_nigropunctatus_-_1.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/2017%2C_cuba%2C_jardines_aggressor%2C_los_indios%2C_nassau_grouper_maw_%2836883128693%29.jpg/250px-2017%2C_cuba%2C_jardines_aggressor%2C_los_indios%2C_nassau_grouper_maw_%2836883128693%29.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/46-EastTimor-Dive2_SecretGarden_06_%28Crocodile_Fish%29-APiazza.JPG/250px-46-EastTimor-Dive2_SecretGarden_06_%28Crocodile_Fish%29-APiazza.JPG",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Ammodytes_hexapterus_portrait.jpg/250px-Ammodytes_hexapterus_portrait.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Anguilla_dieffenbachii_01.jpg/250px-Anguilla_dieffenbachii_01.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Arothron_hispidus_is_kissing_my_camera_at_Big_Island_of_Hawaii.jpg/250px-Arothron_hispidus_is_kissing_my_camera_at_Big_Island_of_Hawaii.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Chlamydoselachus_anguineus_mouth.jpg/250px-Chlamydoselachus_anguineus_mouth.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Corydoras_aeneus_barbels.jpg/250px-Corydoras_aeneus_barbels.jpg",
"https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Diodon_hystrix_smiling.jpg/250px-Diodon_hystrix_smiling.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Epinephelus_polyphekadion.jpg/250px-Epinephelus_polyphekadion.jpg",
"https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Fisch_%289331263926%29.jpg/250px-Fisch_%289331263926%29.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Flickr_-_law_keven_-_Unidentified_Serrasalminae_in_Colchester_Zoo.jpg/250px-Flickr_-_law_keven_-_Unidentified_Serrasalminae_in_Colchester_Zoo.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/FRENCH_ANGEL_FISH.jpg/250px-FRENCH_ANGEL_FISH.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Frogfish_face.jpg/250px-Frogfish_face.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Full_on_Fuelleborni.jpg/250px-Full_on_Fuelleborni.jpg",
"https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Garibaldi%2C_Catalina_Island%2C_Channel_Islands%2C_California.jpg/250px-Garibaldi%2C_Catalina_Island%2C_Channel_Islands%2C_California.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Gfp-nurse-shark.jpg/250px-Gfp-nurse-shark.jpg",
"https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Great_white_shark_south_africa.jpg/250px-Great_white_shark_south_africa.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Heterodontus_galeatus.jpg/250px-Heterodontus_galeatus.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Hypoplectrus_puella_face_view.jpg/250px-Hypoplectrus_puella_face_view.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Karper_30-06-2010_7-35-06.JPG/250px-Karper_30-06-2010_7-35-06.JPG",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Kelp_Blenny_%2832203269100%29.jpg/250px-Kelp_Blenny_%2832203269100%29.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Largemouth_%2811736241335%29.jpg/250px-Largemouth_%2811736241335%29.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Leafy_Sea_Dragon_Front_View_%2818880763469%29.jpg/250px-Leafy_Sea_Dragon_Front_View_%2818880763469%29.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/London_Aquarium_%28539649232%29.jpg/250px-London_Aquarium_%28539649232%29.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Long_Spined_Scorpion_Fish.jpg/250px-Long_Spined_Scorpion_Fish.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Meuschenia_freycineti.jpg/250px-Meuschenia_freycineti.jpg",
"https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/NEW_FISH%21%21%21_1_%284627848327%29.jpg/250px-NEW_FISH%21%21%21_1_%284627848327%29.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Northern_Stargazer.JPG/250px-Northern_Stargazer.JPG",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/NSMT-PL_570_7.18_mm_frontal.jpg/250px-NSMT-PL_570_7.18_mm_frontal.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Oh_hey_there_baby_lake_sturgeon%21_%2815609929482%29.jpg/250px-Oh_hey_there_baby_lake_sturgeon%21_%2815609929482%29.jpg",
"https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Opsanus_beta_2.jpg/250px-Opsanus_beta_2.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Palma_Aquarium-Pez_globo.tif/lossless-page1-250px-Palma_Aquarium-Pez_globo.tif.png",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Paracentropyge_multifasciatus.jpg/250px-Paracentropyge_multifasciatus.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Poisson-lune.jpg/250px-Poisson-lune.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Protopterus.jpg/250px-Protopterus.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Pteroidichthys_amboinensis_2.jpg/250px-Pteroidichthys_amboinensis_2.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Pterois_volitans_Manado-e.jpg/250px-Pterois_volitans_Manado-e.jpg",
"https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Puffer_Fish_DSC01257.JPG/250px-Puffer_Fish_DSC01257.JPG",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Sanc0498_-_Flickr_-_NOAA_Photo_Library.jpg/250px-Sanc0498_-_Flickr_-_NOAA_Photo_Library.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Sans_doute_un_gobie_-_panoramio.jpg/250px-Sans_doute_un_gobie_-_panoramio.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Scorpaenopsis_diabolus_R%C3%A9union.jpg/250px-Scorpaenopsis_diabolus_R%C3%A9union.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Pez_escorpi%C3%B3n_de_cabeza_plana_%28Scorpaenopsis_oxycephala%29%2C_Anilao%2C_Filipinas%2C_2023-08-25%2C_DD_205.jpg/250px-Pez_escorpi%C3%B3n_de_cabeza_plana_%28Scorpaenopsis_oxycephala%29%2C_Anilao%2C_Filipinas%2C_2023-08-25%2C_DD_205.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Small_Fin_%28226275649%29.jpeg/250px-Small_Fin_%28226275649%29.jpeg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Smooth_lumpsucker.jpg/250px-Smooth_lumpsucker.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Splendid_toadfish.jpg/250px-Splendid_toadfish.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Synanceia_verrucosa_66157027.jpg/250px-Synanceia_verrucosa_66157027.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/S%C3%A4rk%C3%A4nniemi_-_fish_3.jpg/250px-S%C3%A4rk%C3%A4nniemi_-_fish_3.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Teeth_of_sharpnose_sevengill_shark_%28Heptranchias_perlo.jpg/250px-Teeth_of_sharpnose_sevengill_shark_%28Heptranchias_perlo.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/UrolophusPaucimaculatus.jpg/250px-UrolophusPaucimaculatus.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Yellow_Mbuna_cichlid_full_frontal.jpg/250px-Yellow_Mbuna_cichlid_full_frontal.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Zebra_Moray_%28Gymnomuraena_zebra%29_%2852684673425%29.jpg/250px-Zebra_Moray_%28Gymnomuraena_zebra%29_%2852684673425%29.jpg",
# "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Betta_face.jpg/330px-Betta_face.jpg",
# "https://www.seattleaquarium.org/wp-content/uploads/2024/08/clownfish-featured.webp",
# "https://adlayasanimals.wordpress.com/wp-content/uploads/2021/01/1920px-titan_triggerfish_balistoides_viridescens_43036754980-1.jpg",
# "https://i.pinimg.com/474x/9f/87/f0/9f87f048d43319dd58230528ad929ff8.jpg",
# "https://www.algaebarn.com/wp-content/uploads/2019/05/shutterstock_218322112.jpg",
# "https://www.reef2reef.com/attachments/yellowtang2019062402-jpg.1395105/",
# "https://www.euro-divers.com/wp-content/uploads/2025/02/parrot-fish.jpg",
# "https://redseafoto.ru/wp-content/uploads/2015/04/redseafish_259.jpg",
]

assert len(urls) > 0
out = Path("./data/fish/images")
out.mkdir(parents=True, exist_ok=True)

for index, url in enumerate(urls, start=1):
    if index > 1:
        delay = random.uniform(2, 5)
        print(f"Waiting {delay:.1f}s before the next request")
        time.sleep(delay)
    extension = Path(urlsplit(url).path).suffix.lower() or ".jpg"
    filename = out / f"fish-{index:03}{extension}"
    for attempt in range(3):
        try:
            request = Request(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0",
                "Connection": "close",
            })
            with urlopen(request) as response:
                filename.write_bytes(response.read())
            break
        except HTTPError as error:
            if error.code != 429 or attempt == 2:
                raise
            delay = random.uniform(20, 40)
            print(f"Rate limited; waiting {delay:.1f}s before retrying")
            time.sleep(delay)
    print(f"Downloaded {filename}")
