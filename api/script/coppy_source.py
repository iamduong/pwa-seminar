# import shutil
# import os

# AUDIO_URL_PREFIX = "/resource/audio"
# AUDIO_URL_PREFIX_V2 = "/resource/audio_v2"

# advanced_audio_path = os.path.join(os.getcwd(), AUDIO_URL_PREFIX)
# print("Advanced audio path:", advanced_audio_path)

# files = os.listdir(AUDIO_URL_PREFIX)

# for file in files:
#     print(file)


import os
import shutil

advanced_audio_path = os.path.join(os.getcwd()) + "/resource/audio"
advanced_audio_path_v2 = os.path.join(os.getcwd()) + "/resource/audio_v2"

files = os.listdir(advanced_audio_path)
for file in files:
    print(file)
    shutil.copyfile(
        os.path.join(advanced_audio_path, file),
        os.path.join(advanced_audio_path_v2, file),
    )
