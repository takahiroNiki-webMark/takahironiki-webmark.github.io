<?php
    if (isset($_COOKIE["visited"])){
        $count = $_COOKIE["visited"] + 1;
    }else{
        $count = 1;
    }

    $flag = setcookie("visited", $count);
?>

<html>
<head><title>PHP TEST</title></head>
<body>

<?php
    print('<p>訪問回数は'.$count.'回目です</p>');
?>

</body>
</html>