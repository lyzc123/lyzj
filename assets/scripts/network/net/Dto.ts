/*
* 数据传输对象接口;
*/
interface Dto {

    /**
     * 写入数据
     * @param b ByteBuf
     */
    writeBytes(b);

    /**
     * 读取数据
     * @param b ByteBuf
     */
    readBytes(b);

}