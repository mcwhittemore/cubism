# 0048

In this sketch I am trying to see what different output sizes causes.

At first I used 3, the output size used in [0048](../0048/3-2-1.jpg). This was fast and, as this is a copy of 0048, resulted in the same thing.

Next I tried an output size of 6. This was also fast and resulted in a much less defined image. As the output size is means we are sampling more from the other images this is not surprising.

Lastly I tried an output of 9. While it always hovered around the desired max error rate, the network was never able drop below .005 and so the max number of iterations were meet. The resulting image is even harder to see than 6. While this was expected, what was not expected was how dark the image is. I assumed that the output size should more represent the other images, but what it seems to have done is force less options of color.