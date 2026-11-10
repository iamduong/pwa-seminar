# from deep_translator import MyMemoryTranslator

# translated = MyMemoryTranslator(source="vi-VN", target="en-GB").translate(
#     "Xin chào, tên tôi là Nguyễn Nam Dương | Năm nay 25 tuổi"
# )

# print(translated)

import asyncio

import edge_tts


async def main():
    text = (
        "Bưu điện Thành phố Hồ Chí Minh. "
        "Đây là một công trình kiến trúc nổi bật của thành phố."
    )

    communicate = edge_tts.Communicate(
        text=text,
        voice="vi-VN-HoaiMyNeural",
    )

    await communicate.save("test.mp3")

    print("Đã tạo file test.mp3")


if __name__ == "__main__":
    asyncio.run(main())
